import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
  admissionNo: { type: String, unique: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  admissionDate: { type: Date, default: Date.now, required: true },
  dischargeDate: { type: Date },
  reason: { type: String, required: true },
  status: { type: String, enum: ['admitted', 'discharged'], default: 'admitted', index: true },
  dischargeNotes: String,
  totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

admissionSchema.pre('save', function(next) {
  if (!this.admissionNo) this.admissionNo = `ADM-${Date.now().toString().slice(-8)}`;
  next();
});

export default mongoose.model('Admission', admissionSchema);
