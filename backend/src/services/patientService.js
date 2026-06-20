import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Invoice from '../models/Invoice.js';
import { ApiError } from '../utils/apiResponse.js';
import { regexSearch } from '../utils/query.js';

export const listPatientsService = async (user, search, skip, limit) => {
  const filter = search ? { $or: [
    { fullName: regexSearch(search) }, 
    { patientId: regexSearch(search) }, 
    { phone: regexSearch(search) },
    { cnic: regexSearch(search) }
  ] } : {};
  
  if (user.role === 'doctor') {
    const Doctor = (await import('../models/Doctor.js')).default;
    const doctor = await Doctor.findOne({ user: user._id });
    const appointments = await Appointment.find({ doctor: doctor?._id || null }).distinct('patient');
    filter._id = { $in: appointments };
  }
  
  const [items, total] = await Promise.all([
    Patient.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('registeredBy','name role'),
    Patient.countDocuments(filter),
  ]);
  
  return { items, total };
};

export const createPatientService = async (patientData, registeredById) => {
  return await Patient.create({ ...patientData, registeredBy: registeredById });
};

export const getPatientProfileService = async (patientId) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new ApiError('Patient not found', 404);
  const [appointments, records, invoices] = await Promise.all([
    Appointment.find({ patient: patient._id }).populate({ path: 'doctor', populate: { path: 'user', select: 'name' } }).sort('-appointmentDate'),
    MedicalRecord.find({ patient: patient._id }).populate({ path: 'doctor', populate: { path: 'user', select: 'name' } }).sort('-createdAt'),
    Invoice.find({ patient: patient._id }).sort('-createdAt'),
  ]);
  return { patient, appointments, records, invoices };
};

export const updatePatientService = async (patientId, updateData) => {
  const patient = await Patient.findByIdAndUpdate(patientId, updateData, { new: true, runValidators: true });
  if (!patient) throw new ApiError('Patient not found', 404);
  return patient;
};
