import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  appointmentDate: { type: Date, required: true, index: true },
  timeSlot: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending','confirmed','completed','cancelled','no-show'], default: 'pending', index: true },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

appointmentSchema.index({ doctor: 1, appointmentDate: 1, timeSlot: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['pending','confirmed'] } } });

export default mongoose.model('Appointment', appointmentSchema);
