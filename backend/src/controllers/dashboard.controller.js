import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Medicine from '../models/Medicine.js';
import Invoice from '../models/Invoice.js';
import LabReport from '../models/LabReport.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const dashboardSummary = asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    const doctorFilter = { doctor: doctor?._id || null };
    const [assignedAppointments, todayAppointments, pendingAppointments, completedAppointments, records, labReports] = await Promise.all([
      Appointment.countDocuments(doctorFilter),
      Appointment.countDocuments({ ...doctorFilter, appointmentDate: { $gte: today, $lt: tomorrow } }),
      Appointment.countDocuments({ ...doctorFilter, status: { $in: ['pending','confirmed'] } }),
      Appointment.countDocuments({ ...doctorFilter, status: 'completed' }),
      import('../models/MedicalRecord.js').then(({ default: MedicalRecord }) => MedicalRecord.countDocuments(doctorFilter)),
      LabReport.countDocuments(doctorFilter),
    ]);
    return ok(res, { assignedAppointments, todayAppointments, pendingAppointments, completedAppointments, records, labReports }, 'Doctor dashboard summary');
  }
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    const patientFilter = { patient: patient?._id || null };
    const [appointments, upcomingAppointments, records, pendingBills, labReports] = await Promise.all([
      Appointment.countDocuments(patientFilter),
      Appointment.countDocuments({ ...patientFilter, appointmentDate: { $gte: today }, status: { $in: ['pending','confirmed'] } }),
      import('../models/MedicalRecord.js').then(({ default: MedicalRecord }) => MedicalRecord.countDocuments(patientFilter)),
      Invoice.countDocuments({ ...patientFilter, paymentStatus: { $ne: 'paid' } }),
      LabReport.countDocuments(patientFilter),
    ]);
    return ok(res, { appointments, upcomingAppointments, records, pendingBills, labReports }, 'Patient dashboard summary');
  }
  if (req.user.role === 'pharmacist') {
    const [medicines, lowStock, expired, totalQuantity] = await Promise.all([
      Medicine.countDocuments(),
      Medicine.countDocuments({ $expr: { $lte: ['$quantity', '$lowStockLimit'] } }),
      Medicine.countDocuments({ expiryDate: { $lt: today } }),
      Medicine.aggregate([{ $group: { _id: null, quantity: { $sum: '$quantity' } } }]),
    ]);
    return ok(res, { medicines, lowStock, expired, totalQuantity: totalQuantity[0]?.quantity || 0 }, 'Pharmacist dashboard summary');
  }
  if (req.user.role === 'accountant') {
    const [pendingInvoices, paidInvoices, revenueAgg] = await Promise.all([
      Invoice.countDocuments({ paymentStatus: { $ne: 'paid' } }),
      Invoice.countDocuments({ paymentStatus: 'paid' }),
      Invoice.aggregate([{ $project: { total: { $subtract: [{ $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.quantity','$$i.unitPrice'] } } } }, '$discount'] }, paidAmount: 1 } }, { $group: { _id: null, revenue: { $sum: '$paidAmount' }, billed: { $sum: '$total' } } }]),
    ]);
    return ok(res, { pendingInvoices, paidInvoices, revenue: revenueAgg[0]?.revenue || 0, billed: revenueAgg[0]?.billed || 0 }, 'Accountant dashboard summary');
  }
  if (req.user.role === 'receptionist') {
    const [patients, todayAppointments, pendingAppointments, doctors] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow } }),
      Appointment.countDocuments({ status: { $in: ['pending','confirmed'] } }),
      Doctor.countDocuments({ isAvailable: true }),
    ]);
    return ok(res, { patients, todayAppointments, pendingAppointments, availableDoctors: doctors }, 'Receptionist dashboard summary');
  }
  if (req.user.role === 'lab_technician') {
    const [pendingReports, completedReports, totalReports] = await Promise.all([
      LabReport.countDocuments({ status: 'pending' }),
      LabReport.countDocuments({ status: 'completed' }),
      LabReport.countDocuments(),
    ]);
    return ok(res, { pendingReports, completedReports, totalReports }, 'Lab Technician dashboard summary');
  }
  const [users, patients, doctors, todayAppointments, lowStock, invoices, revenueAgg, labReports] = await Promise.all([
    User.countDocuments(), Patient.countDocuments(), Doctor.countDocuments(),
    Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow } }),
    Medicine.countDocuments({ $expr: { $lte: ['$quantity', '$lowStockLimit'] } }),
    Invoice.countDocuments({ paymentStatus: { $ne: 'paid' } }),
    Invoice.aggregate([{ $project: { total: { $subtract: [{ $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.quantity','$$i.unitPrice'] } } } }, '$discount'] }, paidAmount: 1 } }, { $group: { _id: null, revenue: { $sum: '$paidAmount' }, billed: { $sum: '$total' } } }]),
    LabReport.countDocuments(),
  ]);
  ok(res, { users, patients, doctors, todayAppointments, lowStock, pendingInvoices: invoices, revenue: revenueAgg[0]?.revenue || 0, billed: revenueAgg[0]?.billed || 0, labReports }, 'Dashboard summary');
});

export const appointmentTrend = asyncHandler(async (req, res) => {
  const match = {};
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    match.doctor = doctor?._id || null;
  }
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    match.patient = patient?._id || null;
  }
  const data = await Appointment.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  
  if (data.length === 0) {
    return ok(res, [], 'Appointment trend');
  }

  // Ensure we don't create an infinitely large array if dates are far apart
  // Limit to at most 30 days range
  let trendData = [];
  const start = new Date(data[0]._id + 'T00:00:00Z');
  let end = new Date(data[data.length - 1]._id + 'T00:00:00Z');
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 30) {
    // If range is too large, just return the raw data, or limit the start date
    start.setTime(end.getTime() - (30 * 24 * 60 * 60 * 1000));
  }

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const existing = data.find(item => item._id === dateStr);
    trendData.push({
      date: dateStr,
      appointments: existing ? existing.count : 0
    });
  }

  ok(res, trendData, 'Appointment trend');
});
