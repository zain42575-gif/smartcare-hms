import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { buildPagination } from '../utils/query.js';
import * as appointmentService from '../services/appointmentService.js';

export const listAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const { items, total } = await appointmentService.listAppointmentsService(req.user, req.query, skip, limit);
  ok(res, items, 'Appointments fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.createAppointmentService(req.body, req.user);
  ok(res, appointment, 'Appointment booked', 201);
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.updateAppointmentService(req.params.id, req.body);
  ok(res, appointment, 'Appointment updated');
});
