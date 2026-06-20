import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['admin', 'doctor', 'receptionist', 'pharmacist', 'accountant', 'patient', 'lab_technician'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, required: true, index: true },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active', index: true },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: String,
  pendingDoctorProfile: {
    specialization: String,
    department: String,
    qualification: String,
    experienceYears: Number,
    consultationFee: Number,
    roomNo: String,
  },
  avatar: String,
  address: String,
  lastLoginAt: Date,
  tokenVersion: { type: Number, default: 0 },
  twoFactorSecret: String,
  isTwoFactorEnabled: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model('User', userSchema);
