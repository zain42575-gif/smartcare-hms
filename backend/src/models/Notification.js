import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  role: { type: String, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['appointment','billing','inventory','system'], default: 'system' },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true });

import { getIO } from '../utils/socket.js';

notificationSchema.post('save', function(doc) {
  try {
    const io = getIO();
    if (doc.user) {
      io.to(doc.user.toString()).emit('notification', doc);
    } else if (doc.role) {
      io.to(`role_${doc.role}`).emit('notification', doc);
    }
  } catch (err) {
    console.error('Socket notification emit failed:', err.message);
  }
});

export default mongoose.model('Notification', notificationSchema);
