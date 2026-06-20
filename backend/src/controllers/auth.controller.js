import jwt from 'jsonwebtoken';
import User, { ROLES } from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Notification from '../models/Notification.js';
import Session from '../models/Session.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, ok } from '../utils/apiResponse.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const signToken = (user) => jwt.sign({ id: user._id, role: user.role, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
const signRefreshToken = (user) => jwt.sign({ id: user._id, tokenVersion: user.tokenVersion }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
const safeUserById = (id) => User.findById(id).select('-passwordHash -twoFactorSecret');
const googleCertsUrl = 'https://www.googleapis.com/oauth2/v3/certs';
let googleCertCache = { expiresAt: 0, keys: [] };

const certToPem = (cert) => {
  const lines = cert.match(/.{1,64}/g)?.join('\n');
  return `-----BEGIN CERTIFICATE-----\n${lines}\n-----END CERTIFICATE-----\n`;
};

const getGoogleCerts = async () => {
  if (googleCertCache.expiresAt > Date.now()) return googleCertCache.keys;
  const response = await fetch(googleCertsUrl);
  if (!response.ok) throw new ApiError('Unable to verify Google account right now', 503);
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
  const data = await response.json();
  googleCertCache = { expiresAt: Date.now() + maxAge * 1000, keys: data.keys || [] };
  return googleCertCache.keys;
};

const verifyGoogleCredential = async (credential) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new ApiError('Google login is not configured on the server', 500);
  if (!credential) throw new ApiError('Google credential is required', 400);
  const decoded = jwt.decode(credential, { complete: true });
  if (!decoded?.header?.kid) throw new ApiError('Invalid Google credential', 401);
  const key = (await getGoogleCerts()).find(item => item.kid === decoded.header.kid);
  if (!key?.x5c?.[0]) throw new ApiError('Unable to verify Google credential', 401);
  return jwt.verify(credential, certToPem(key.x5c[0]), {
    algorithms: ['RS256'],
    audience: clientId,
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
  });
};

const setAuthCookies = async (res, user, req) => {
  const token = signToken(user);
  const refreshToken = signRefreshToken(user);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await Session.create({
    userId: user._id,
    refreshToken,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    expiresAt
  });

  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return { token, refreshToken };
};

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) throw new ApiError('Email, password and role are required', 400);
  if (!ROLES.includes(role)) throw new ApiError('Selected login role is invalid', 400);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) throw new ApiError('Invalid email or password', 401);
  if (user.role !== role) throw new ApiError(`This account is registered as ${user.role}, not ${role}`, 403);
  if (user.status === 'pending') throw new ApiError('Your doctor account is waiting for admin approval', 403);
  if (user.status !== 'active') throw new ApiError('Your account is inactive', 403);
  
  user.lastLoginAt = new Date();
  await user.save();

  if (user.isTwoFactorEnabled) {
    // Need 2FA to proceed, don't set cookies yet
    return ok(res, { requires2fa: true, userId: user._id }, 'Two-factor authentication required');
  }

  await setAuthCookies(res, user, req);
  ok(res, { user: await safeUserById(user._id) }, 'Login successful');
});

export const verify2faLogin = asyncHandler(async (req, res) => {
  const { userId, token } = req.body;
  if (!userId || !token) throw new ApiError('UserId and 2FA token are required', 400);
  
  const user = await User.findById(userId);
  if (!user || !user.isTwoFactorEnabled) throw new ApiError('Invalid request', 400);

  const isVerified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 1
  });

  if (!isVerified) throw new ApiError('Invalid 2FA code', 401);

  await setAuthCookies(res, user, req);
  ok(res, { user: await safeUserById(user._id) }, 'Login successful');
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) throw new ApiError('Refresh token required', 401);
  
  const session = await Session.findOne({ refreshToken });
  if (!session) throw new ApiError('Invalid session', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (err) {
    await session.deleteOne();
    throw new ApiError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || user.status !== 'active' || user.tokenVersion !== decoded.tokenVersion) {
    await session.deleteOne();
    throw new ApiError('Invalid refresh token', 401);
  }

  const token = signToken(user);
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 15 * 60 * 1000
  });

  // Update session last active
  session.lastActive = new Date();
  await session.save();

  ok(res, null, 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await Session.deleteOne({ refreshToken });
  }
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  };
  
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  ok(res, null, 'Logged out successfully');
});

export const registerPatient = asyncHandler(async (req, res) => {
  const { name, email, password, phone, gender, dateOfBirth, address, bloodGroup } = req.body;
  if (!name || !email || !password || !phone || !gender) throw new ApiError('Name, email, password, phone and gender are required', 400);
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError('Email already registered', 409);
  const user = await User.create({ name, email, phone, passwordHash: password, role: 'patient' });
  await Patient.create({ user: user._id, fullName: name, phone, email, gender, dateOfBirth, address, bloodGroup: bloodGroup || 'unknown' });
  
  await setAuthCookies(res, user, req);
  ok(res, { user: await safeUserById(user._id) }, 'Patient account created successfully', 201);
});

export const registerDoctorRequest = asyncHandler(async (req, res) => {
  const { name, email, password, phone, specialization, department, qualification, experienceYears, consultationFee } = req.body;
  if (!name || !email || !password || !phone || !specialization || !department || !consultationFee) throw new ApiError('Required doctor application fields missing', 400);
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError('Email already registered', 409);
  const user = await User.create({
    name, email, phone, passwordHash: password, role: 'doctor', status: 'pending',
    pendingDoctorProfile: { specialization, department, qualification, experienceYears, consultationFee }
  });
  await Notification.create({ role: 'admin', title: 'New doctor approval request', message: `${name} requested to join ${department}`, type: 'system' });
  ok(res, { user: await safeUserById(user._id) }, 'Doctor application submitted. Admin approval is required before login.', 201);
});

export const googleLogin = asyncHandler(async (req, res) => {
  const profile = await verifyGoogleCredential(req.body.credential);
  if (!profile.email || !profile.email_verified) throw new ApiError('Google email is not verified', 401);
  const email = profile.email.toLowerCase();
  const name = profile.name || email.split('@')[0];
  let user = await User.findOne({ email });
  if (user && user.role !== 'patient') throw new ApiError('Google login is only available for patient accounts', 403);
  if (!user) {
    user = await User.create({
      name,
      email,
      phone: 'Google account',
      passwordHash: Math.random().toString(36),
      role: 'patient',
      provider: 'google',
      googleId: profile.sub,
      avatar: profile.picture,
    });
    await Patient.create({ user: user._id, fullName: name, phone: 'Google account', email, gender: 'other', bloodGroup: 'unknown' });
  } else {
    user.provider = 'google';
    user.googleId = user.googleId || profile.sub;
    user.avatar = user.avatar || profile.picture;
  }
  if (user.status !== 'active') throw new ApiError('Account is not active', 403);
  user.lastLoginAt = new Date();
  await user.save();
  
  await setAuthCookies(res, user, req);
  ok(res, { user: await safeUserById(user._id) }, 'Google login successful');
});

export const me = asyncHandler(async (req, res) => ok(res, req.user, 'Profile fetched'));

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError('Current and new password are required', 400);
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.comparePassword(currentPassword))) throw new ApiError('Current password is incorrect', 400);
  user.passwordHash = newPassword;
  await user.save();
  ok(res, null, 'Password updated');
});

export const generate2fa = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.isTwoFactorEnabled) throw new ApiError('2FA is already enabled', 400);

  const secret = speakeasy.generateSecret({
    name: `SmartCare HMS (${user.email})`
  });

  user.twoFactorSecret = secret.base32;
  await user.save();

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
  ok(res, { qrCodeUrl, secret: secret.base32 }, '2FA secret generated');
});

export const enable2fa = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError('Token is required', 400);

  const user = await User.findById(req.user._id);
  
  const isVerified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 1
  });

  if (!isVerified) throw new ApiError('Invalid 2FA code', 400);

  user.isTwoFactorEnabled = true;
  await user.save();
  
  ok(res, null, '2FA has been successfully enabled');
});
