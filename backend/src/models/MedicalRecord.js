import mongoose from 'mongoose';

const prescribedItemSchema = new mongoose.Schema({
  medicineName: String,
  dosage: String,
  frequency: String,
  duration: String,
  instructions: String,
}, { _id: false });

const medicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
  symptoms: [String],
  diagnosis: { type: String, required: true },
  treatmentNotes: String,
  labAdvice: [String],
  prescription: [prescribedItemSchema],
  followUpDate: Date,
}, { timestamps: true });

export default mongoose.model('MedicalRecord', medicalRecordSchema);
