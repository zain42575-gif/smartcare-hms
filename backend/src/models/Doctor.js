import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  day: { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  start: String,
  end: String,
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true, index: true },
  department: { type: String, required: true, index: true },
  qualification: String,
  experienceYears: { type: Number, default: 0 },
  consultationFee: { type: Number, required: true, min: 0 },
  availability: [availabilitySchema],
  roomNo: String,
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Doctor', doctorSchema);
