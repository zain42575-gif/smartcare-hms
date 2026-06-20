import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { buildPagination } from '../utils/query.js';
import * as patientService from '../services/patientService.js';

export const listPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const search = req.query.search;
  
  const { items, total } = await patientService.listPatientsService(req.user, search, skip, limit);
  
  ok(res, items, 'Patients fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const createPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.createPatientService(req.body, req.user._id);
  ok(res, patient, 'Patient registered', 201);
});

export const getPatient = asyncHandler(async (req, res) => {
  const data = await patientService.getPatientProfileService(req.params.id);
  ok(res, data, 'Patient profile fetched');
});

export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatientService(req.params.id, req.body);
  ok(res, patient, 'Patient updated');
});
