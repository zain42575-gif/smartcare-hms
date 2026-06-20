import MedicalRecord from '../models/MedicalRecord.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, ok } from '../utils/apiResponse.js';
import { buildPagination } from '../utils/query.js';

export const listRecords = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const filter = {};
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.doctor) filter.doctor = req.query.doctor;
  if (req.user.role === 'patient') { const p = await Patient.findOne({ user: req.user._id }); filter.patient = p?._id || null; }
  if (req.user.role === 'doctor') { const d = await Doctor.findOne({ user: req.user._id }); filter.doctor = d?._id || null; }
  const [items, total] = await Promise.all([
    MedicalRecord.find(filter).populate('patient','fullName patientId email gender bloodGroup').populate({ path: 'doctor', populate: { path: 'user', select: 'name' } }).populate('appointment','appointmentDate timeSlot status').sort('-createdAt').skip(skip).limit(limit),
    MedicalRecord.countDocuments(filter),
  ]);
  ok(res, items, 'Medical records fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const createRecord = asyncHandler(async (req, res) => {
  if (req.user.role === 'patient') throw new ApiError('Patients can view records but cannot create them', 403);
  let { appointment, patient, doctor, diagnosis } = req.body;
  if (req.user.role === 'doctor') {
    const doctorDoc = await Doctor.findOne({ user: req.user._id });
    if (!doctorDoc) throw new ApiError('Doctor profile not found for this account', 404);
    doctor = doctorDoc._id;
  }
  if (!appointment || !patient || !doctor || !diagnosis) throw new ApiError('Appointment, patient, doctor and diagnosis are required', 400);
  const linkedAppointment = await Appointment.findById(appointment);
  if (!linkedAppointment) throw new ApiError('Appointment not found', 404);
  if (String(linkedAppointment.patient) !== String(patient) || String(linkedAppointment.doctor) !== String(doctor)) throw new ApiError('Appointment does not match selected patient and doctor', 400);
  const record = await MedicalRecord.create({ ...req.body, doctor });
  await Appointment.findByIdAndUpdate(appointment, { status: 'completed' });

  const populatedRecord = await MedicalRecord.findById(record._id).populate('patient').populate({ path: 'doctor', populate: { path: 'user' } });
  if (populatedRecord.patient?.user) {
    await Notification.create({
      user: populatedRecord.patient.user,
      title: 'New Medical Record',
      message: `Dr. ${populatedRecord.doctor?.user?.name?.replace(/^Dr\.?\s*/i, '') || 'your doctor'} has uploaded a new medical record for your recent visit.`,
      type: 'system'
    });
  }

  ok(res, record, 'Medical record saved', 201);
});

export const updateRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!record) throw new ApiError('Record not found', 404);
  ok(res, record, 'Medical record updated');
});
