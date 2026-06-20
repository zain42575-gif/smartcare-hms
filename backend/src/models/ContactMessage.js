import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true });

export default mongoose.model('ContactMessage', contactMessageSchema);
