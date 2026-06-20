import mongoose from 'mongoose';

const labReportSchema = new mongoose.Schema({
  reportNo: { type: String, unique: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', index: true },
  testName: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending', index: true },
  resultSummary: { type: String, default: '' },
  technicianNotes: { type: String, default: '' },
  cost: { type: Number, required: true, min: 0, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid', index: true },
  attachmentUrl: { type: String, default: '' },
  performedAt: Date,
}, { timestamps: true });

labReportSchema.pre('save', function(next) {
  if (!this.reportNo) {
    this.reportNo = `LAB-${Date.now().toString().slice(-8)}`;
  }
  if (this.status === 'completed' && !this.performedAt) {
    this.performedAt = new Date();
  }
  next();
});

export default mongoose.model('LabReport', labReportSchema);
