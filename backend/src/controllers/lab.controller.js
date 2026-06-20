import LabReport from '../models/LabReport.js';
import Patient from '../models/Patient.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, ok } from '../utils/apiResponse.js';
import { buildPagination, regexSearch } from '../utils/query.js';

export const listLabReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.search) {
    filter.testName = regexSearch(req.query.search);
  }

  // If patient, restrict to their own records
  if (req.user.role === 'patient') {
    const p = await Patient.findOne({ user: req.user._id });
    filter.patient = p?._id || null;
  }

  const [items, total] = await Promise.all([
    LabReport.find(filter)
      .populate('patient', 'fullName patientId phone')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    LabReport.countDocuments(filter),
  ]);

  ok(res, items, 'Lab reports fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getLabReportById = asyncHandler(async (req, res) => {
  const report = await LabReport.findById(req.params.id)
    .populate('patient', 'fullName patientId phone email address gender dateOfBirth')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

  if (!report) throw new ApiError('Lab report not found', 404);

  // If patient, check they own this report
  if (req.user.role === 'patient') {
    const p = await Patient.findOne({ user: req.user._id });
    if (String(report.patient._id) !== String(p?._id)) {
      throw new ApiError('Unauthorized to view this report', 403);
    }
  }

  ok(res, report, 'Lab report details fetched');
});

export const createLabReport = asyncHandler(async (req, res) => {
  if (req.user.role === 'patient') {
    throw new ApiError('Patients cannot order lab tests', 403);
  }

  const { patient, doctor, testName, cost, paymentStatus } = req.body;
  if (!patient || !testName) {
    throw new ApiError('Patient and Test Name are required', 400);
  }

  const report = await LabReport.create({
    patient,
    doctor: doctor || undefined,
    testName,
    cost: Number(cost) || 0,
    paymentStatus: paymentStatus || 'unpaid',
    status: 'pending'
  });

  // Notify receptionist/accountant if unpaid
  if (report.paymentStatus === 'unpaid') {
    await Notification.create({
      role: 'accountant',
      title: 'Lab Fee Pending',
      message: `Pending payment for lab test: ${report.testName} (${report.reportNo})`,
      type: 'billing'
    });
  }

  ok(res, report, 'Lab test ordered successfully', 201);
});

export const updateLabReport = asyncHandler(async (req, res) => {
  if (req.user.role === 'patient') {
    throw new ApiError('Patients cannot update lab tests', 403);
  }

  const report = await LabReport.findById(req.params.id);
  if (!report) throw new ApiError('Lab report not found', 404);

  const { resultSummary, technicianNotes, status, paymentStatus, cost, attachmentUrl } = req.body;

  if (resultSummary !== undefined) report.resultSummary = resultSummary;
  if (technicianNotes !== undefined) report.technicianNotes = technicianNotes;
  if (paymentStatus !== undefined) report.paymentStatus = paymentStatus;
  if (cost !== undefined) report.cost = Number(cost);
  if (attachmentUrl !== undefined) report.attachmentUrl = attachmentUrl;

  const oldStatus = report.status;
  if (status !== undefined) report.status = status;

  await report.save();

  // If status changed to completed, notify the patient (if patient user exists)
  if (status === 'completed' && oldStatus !== 'completed') {
    const populatedPatient = await Patient.findById(report.patient).populate('user');
    if (populatedPatient?.user) {
      await Notification.create({
        user: populatedPatient.user._id,
        title: 'Lab Report Ready',
        message: `Your lab report for ${report.testName} (${report.reportNo}) is ready.`,
        type: 'info'
      });
    }
  }

  ok(res, report, 'Lab report updated successfully');
});
