import Admission from '../models/Admission.js';
import Bed from '../models/Bed.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, ok } from '../utils/apiResponse.js';
import { buildPagination } from '../utils/query.js';

export const listAdmissions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.doctor) filter.doctor = req.query.doctor;

  if (req.user.role === 'patient') {
    const patientDoc = await Patient.findOne({ user: req.user._id });
    filter.patient = patientDoc?._id || null;
  }
  if (req.user.role === 'doctor') {
    const doctorDoc = await Doctor.findOne({ user: req.user._id });
    filter.doctor = doctorDoc?._id || null;
  }

  const [items, total] = await Promise.all([
    Admission.find(filter)
      .populate('patient', 'fullName patientId phone bloodGroup gender')
      .populate('bed', 'bedNumber roomNumber type pricePerDay')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name specialization department' } })
      .sort('-admissionDate')
      .skip(skip)
      .limit(limit),
    Admission.countDocuments(filter)
  ]);

  ok(res, items, 'Admissions fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const admitPatient = asyncHandler(async (req, res) => {
  const { patient, bed, doctor, reason, admissionDate } = req.body;

  if (!patient || !bed || !doctor || !reason) {
    throw new ApiError('Patient, bed, doctor, and reason are required', 400);
  }

  const [patientDoc, bedDoc, doctorDoc] = await Promise.all([
    Patient.findById(patient),
    Bed.findById(bed),
    Doctor.findById(doctor)
  ]);

  if (!patientDoc) throw new ApiError('Patient not found', 404);
  if (!bedDoc) throw new ApiError('Bed not found', 404);
  if (!doctorDoc) throw new ApiError('Doctor not found', 404);

  if (bedDoc.status !== 'available') {
    throw new ApiError(`Selected Bed (${bedDoc.bedNumber}) is currently ${bedDoc.status}`, 400);
  }

  // Check if patient is already admitted
  const alreadyAdmitted = await Admission.findOne({ patient, status: 'admitted' });
  if (alreadyAdmitted) {
    throw new ApiError('Patient is already admitted to another room/bed', 400);
  }

  // Create admission record
  const admission = await Admission.create({
    patient,
    bed,
    doctor,
    reason,
    admissionDate: admissionDate || Date.now(),
    status: 'admitted'
  });

  // Update Bed status to occupied
  bedDoc.status = 'occupied';
  await bedDoc.save();

  // Create notifications
  await Notification.create({
    role: 'doctor',
    title: 'Patient Admitted',
    message: `${patientDoc.fullName} has been admitted under your care in room ${bedDoc.roomNumber}, bed ${bedDoc.bedNumber}`,
    type: 'system'
  });

  ok(res, admission, 'Patient admitted successfully', 201);
});

export const dischargePatient = asyncHandler(async (req, res) => {
  const { dischargeNotes, dischargeDate } = req.body;
  const admission = await Admission.findById(req.params.id);

  if (!admission) throw new ApiError('Admission record not found', 404);
  if (admission.status === 'discharged') {
    throw new ApiError('Patient has already been discharged from this admission', 400);
  }

  const bedDoc = await Bed.findById(admission.bed);
  const patientDoc = await Patient.findById(admission.patient);

  const end = dischargeDate ? new Date(dischargeDate) : new Date();
  const start = new Date(admission.admissionDate);
  const diffTime = Math.max(0, end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // minimum 1 day billing

  const billingPrice = diffDays * (bedDoc ? bedDoc.pricePerDay : 0);

  // Update admission details
  admission.status = 'discharged';
  admission.dischargeDate = end;
  admission.dischargeNotes = dischargeNotes || 'Discharged in stable condition';
  admission.totalPrice = billingPrice;
  await admission.save();

  // Free the bed if it exists
  if (bedDoc) {
    bedDoc.status = 'available';
    await bedDoc.save();
  }

  // Create billing invoice automatically
  if (bedDoc && patientDoc) {
    const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
    const invoice = await Invoice.create({
      invoiceNo,
      patient: admission.patient,
      appointment: null,
      items: [{
        type: 'service',
        description: `Room Charges (Bed: ${bedDoc.bedNumber}, Type: ${bedDoc.type}) - ${diffDays} day(s)`,
        quantity: 1,
        unitPrice: billingPrice
      }],
      discount: 0,
      paidAmount: 0,
      paymentMethod: 'none',
      paymentStatus: 'unpaid',
      createdBy: req.user._id
    });

    // Notify accountant
    await Notification.create({
      role: 'accountant',
      title: 'Discharge Bill Generated',
      message: `Pending invoice ${invoice.invoiceNo} generated for patient ${patientDoc.fullName} (Stay: ${diffDays} days)`,
      type: 'billing'
    });
  }

  ok(res, admission, 'Patient discharged and room charges invoiced successfully');
});
