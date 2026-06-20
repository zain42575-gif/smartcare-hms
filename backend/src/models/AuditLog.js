import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true, index: true },
  module: { type: String, required: true, index: true },
  description: String,
  ipAddress: String,
}, { timestamps: true });

const immutableError = new Error('Audit logs are immutable and cannot be modified or deleted.');

auditLogSchema.pre('updateOne', () => { throw immutableError; });
auditLogSchema.pre('findOneAndUpdate', () => { throw immutableError; });
auditLogSchema.pre('updateMany', () => { throw immutableError; });
auditLogSchema.pre('deleteOne', () => { throw immutableError; });
auditLogSchema.pre('findOneAndDelete', () => { throw immutableError; });
auditLogSchema.pre('deleteMany', () => { throw immutableError; });

export default mongoose.model('AuditLog', auditLogSchema);
