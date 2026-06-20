import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  bedNumber: { type: String, required: true, unique: true, index: true },
  roomNumber: { type: String, required: true },
  type: { type: String, enum: ['general', 'semi-private', 'private', 'icu'], required: true },
  status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available', index: true },
  pricePerDay: { type: Number, required: true, min: 0 }
}, { timestamps: true });

export default mongoose.model('Bed', bedSchema);
