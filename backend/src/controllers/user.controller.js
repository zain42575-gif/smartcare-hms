import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, ok } from '../utils/apiResponse.js';
import { buildPagination, regexSearch } from '../utils/query.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.$or = [{ name: regexSearch(req.query.search) }, { email: regexSearch(req.query.search) }];
  const [items, total] = await Promise.all([
    User.find(filter).select('-passwordHash').sort({ status: -1, createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  ok(res, items, 'Users fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, address, status } = req.body;
  if (!name || !email || !password || !role) throw new ApiError('Name, email, password and role are required', 400);
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError('Email already exists', 409);
  const user = await User.create({ name, email, phone, address, role, status, passwordHash: password });
  ok(res, await User.findById(user._id).select('-passwordHash'), 'User created', 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name','phone','address','role','status','avatar'];
  const payload = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).select('-passwordHash');
  if (!user) throw new ApiError('User not found', 404);
  ok(res, user, 'User updated');
});

export const approveDoctor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'doctor') throw new ApiError('Pending doctor user not found', 404);
  const profile = user.pendingDoctorProfile || {};
  const payload = {
    user: user._id,
    specialization: req.body.specialization || profile.specialization,
    department: req.body.department || profile.department,
    qualification: req.body.qualification || profile.qualification,
    experienceYears: req.body.experienceYears ?? profile.experienceYears ?? 0,
    consultationFee: req.body.consultationFee ?? profile.consultationFee,
    roomNo: req.body.roomNo || profile.roomNo || 'TBA',
    availability: req.body.availability || [{ day: 'Mon', start: '09:00', end: '14:00' }, { day: 'Wed', start: '10:00', end: '14:00' }],
    isAvailable: true,
  };
  if (!payload.specialization || !payload.department || payload.consultationFee === undefined) throw new ApiError('Doctor profile is incomplete', 400);
  const doctor = await Doctor.findOneAndUpdate({ user: user._id }, payload, { upsert: true, new: true, runValidators: true });
  user.status = 'active';
  user.pendingDoctorProfile = undefined;
  await user.save();
  await Notification.create({ user: user._id, title: 'Doctor account approved', message: 'Your doctor account is now active. You can login to HMS.', type: 'system' });
  ok(res, { user: await User.findById(user._id).select('-passwordHash'), doctor }, 'Doctor approved and activated');
});
