import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { ApiError } from '../utils/apiResponse.js';

export const listAppointmentsService = async (user, query, skip, limit) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    const [matchingPatients, matchingDoctors] = await Promise.all([
      Patient.find({ fullName: searchRegex }).distinct('_id'),
      Doctor.populate(await User.find({ name: searchRegex, role: 'doctor' }), { path: 'user' })
    ]);
    const doctorUserIds = await User.find({ name: searchRegex, role: 'doctor' }).distinct('_id');
    const doctorIds = await Doctor.find({ user: { $in: doctorUserIds } }).distinct('_id');
    
    filter.$or = [
      { patient: { $in: matchingPatients } },
      { doctor: { $in: doctorIds } }
    ];
  }
  if (query.doctor) filter.doctor = query.doctor;
  if (query.patient) filter.patient = query.patient;
  if (user.role === 'patient') {
    const patient = await Patient.findOne({ user: user._id });
    filter.patient = patient?._id || null;
  }
  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: user._id });
    filter.doctor = doctor?._id || null;
  }
  if (query.date) {
    const start = new Date(query.date); const end = new Date(start); end.setDate(end.getDate() + 1);
    filter.appointmentDate = { $gte: start, $lt: end };
  }
  const [items, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient','fullName patientId phone')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name phone' } })
      .sort('appointmentDate timeSlot')
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);
  
  return { items, total };
};

export const createAppointmentService = async (data, user) => {
  let { patient, doctor, appointmentDate, timeSlot, reason, status } = data;
  if (user.role === 'patient') {
    const patientDoc = await Patient.findOne({ user: user._id });
    if (!patientDoc) throw new ApiError('Patient profile not found for this account', 404);
    patient = patientDoc._id;
  }
  if (!patient || !doctor || !appointmentDate || !timeSlot || !reason) throw new ApiError('Patient, doctor, date, slot and reason are required', 400);
  const [p, d] = await Promise.all([Patient.findById(patient), Doctor.findById(doctor).populate('user','name')]);
  if (!p || !d) throw new ApiError('Patient or doctor not found', 404);
  if (!d.isAvailable) throw new ApiError('Selected doctor is currently unavailable', 400);
  const start = new Date(appointmentDate); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(end.getDate()+1);
  const existing = await Appointment.findOne({ doctor, appointmentDate: { $gte: start, $lt: end }, timeSlot, status: { $in: ['pending','confirmed'] } });
  if (existing) throw new ApiError('This doctor already has an appointment in this slot', 409);
  
  const appointment = await Appointment.create({ 
    patient, 
    doctor, 
    appointmentDate, 
    timeSlot, 
    reason, 
    createdBy: user._id, 
    status: user.role === 'patient' ? 'pending' : (status || 'confirmed') 
  });
  
  await Notification.create({ role: 'receptionist', title: 'New appointment', message: `${p.fullName} booked appointment with ${d.user?.name || 'doctor'}`, type: 'appointment' });
  await Notification.create({ 
    user: d.user._id, 
    title: 'New Appointment Booked', 
    message: `Patient ${p.fullName} has booked an appointment with you for ${new Date(appointmentDate).toLocaleDateString()} at slot ${timeSlot}.`, 
    type: 'appointment' 
  });
  
  return appointment;
};

export const updateAppointmentService = async (id, data) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError('Appointment not found', 404);

  const { doctor, appointmentDate, timeSlot, status } = data;
  const oldStatus = appointment.status;

  const finalDoctor = doctor || appointment.doctor;
  const finalDate = appointmentDate ? new Date(appointmentDate) : appointment.appointmentDate;
  const finalTimeSlot = timeSlot || appointment.timeSlot;
  const finalStatus = status || appointment.status;

  if (['pending', 'confirmed'].includes(finalStatus)) {
    const isDocChanged = doctor && String(doctor) !== String(appointment.doctor);
    const isDateChanged = appointmentDate && new Date(appointmentDate).getTime() !== new Date(appointment.appointmentDate).getTime();
    const isSlotChanged = timeSlot && timeSlot !== appointment.timeSlot;

    if (isDocChanged || isDateChanged || isSlotChanged) {
      const d = await Doctor.findById(finalDoctor);
      if (!d) throw new ApiError('Doctor not found', 404);
      if (!d.isAvailable) throw new ApiError('Selected doctor is currently unavailable', 400);

      const start = new Date(finalDate); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(end.getDate()+1);

      const existing = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctor: finalDoctor,
        appointmentDate: { $gte: start, $lt: end },
        timeSlot: finalTimeSlot,
        status: { $in: ['pending','confirmed'] }
      });
      if (existing) throw new ApiError('This doctor already has an appointment in this slot', 409);
    }
  }

  Object.assign(appointment, data);
  await appointment.save();

  const populated = await Appointment.findById(appointment._id)
    .populate('patient','fullName patientId phone user')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name phone' } });

  if (status && status !== oldStatus) {
    if (status === 'confirmed') {
      await Notification.create({
        user: populated.patient.user,
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${populated.doctor?.user?.name || ''} on ${new Date(populated.appointmentDate).toLocaleDateString()} at ${populated.timeSlot} has been confirmed by the receptionist.`,
        type: 'appointment'
      });
      await Notification.create({
        user: populated.doctor.user._id,
        title: 'Appointment Confirmed',
        message: `Your appointment with ${populated.patient.fullName} on ${new Date(populated.appointmentDate).toLocaleDateString()} at ${populated.timeSlot} has been confirmed.`,
        type: 'appointment'
      });
    } else if (status === 'cancelled') {
      await Notification.create({
        user: populated.patient.user,
        title: 'Appointment Cancelled',
        message: `Your appointment with Dr. ${populated.doctor?.user?.name || ''} on ${new Date(populated.appointmentDate).toLocaleDateString()} has been cancelled.`,
        type: 'appointment'
      });
      await Notification.create({
        user: populated.doctor.user._id,
        title: 'Appointment Cancelled',
        message: `The appointment with ${populated.patient.fullName} on ${new Date(populated.appointmentDate).toLocaleDateString()} at ${populated.timeSlot} has been cancelled.`,
        type: 'appointment'
      });
    }
  }

  return populated;
};
