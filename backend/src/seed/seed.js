import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Medicine from '../models/Medicine.js';
import Invoice from '../models/Invoice.js';
import LabReport from '../models/LabReport.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Bed from '../models/Bed.js';
import Admission from '../models/Admission.js';

const passwordHash = 'Password@123';
const daysFromNow = (days, hour = 10) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour,0,0,0); return d; };

async function seed() {
  await connectDB();
  await Promise.all([User.deleteMany(), Patient.deleteMany(), Doctor.deleteMany(), Appointment.deleteMany(), MedicalRecord.deleteMany(), Medicine.deleteMany(), Invoice.deleteMany(), Notification.deleteMany(), LabReport.deleteMany(), Bed.deleteMany(), Admission.deleteMany()]);

  const coreUsersData = [
    { name:'System Admin', email:'admin@alhidayathospital.com', phone:'03000000001', role:'admin', passwordHash },
    { name:'Reception Desk', email:'receptionist@alhidayathospital.com', phone:'03000000003', role:'receptionist', passwordHash },
    { name:'Pharmacy Officer', email:'pharmacy@alhidayathospital.com', phone:'03000000004', role:'pharmacist', passwordHash },
    { name:'Accounts Officer', email:'accountant@alhidayathospital.com', phone:'03000000005', role:'accountant', passwordHash },
    { name:'Lab Technician', email:'labtechnician@alhidayathospital.com', phone:'03000000006', role:'lab_technician', passwordHash },
  ];
  const coreUsers = [];
  for (const userData of coreUsersData) coreUsers.push(await User.create(userData));
  const [admin, receptionist] = coreUsers;
  const [,, pharmacist, accountant] = coreUsers;

  const doctorsInput = [
    ['Dr. Hidayat Hussain','hidayat@alhidayathospital.com','03000000011','Cardiology','Cardiology','MBBS, FCPS',8,2500,'C-12'],
    ['Dr. Hamza Malik','hamza@alhidayathospital.com','03000000012','Neurology','Neurology','MBBS, MD Neurology',10,3000,'N-04'],
    ['Dr. Sara Ahmed','sara@alhidayathospital.com','03000000013','Pediatrics','Children Ward','MBBS, DCH',6,1800,'P-02'],
    ['Dr. Bilal Shah','bilal@alhidayathospital.com','03000000014','Orthopedics','Orthopedics','MBBS, MS Ortho',9,2200,'O-09'],
    ['Dr. Hina Fatima','hina@alhidayathospital.com','03000000015','Dermatology','Dermatology','MBBS, MCPS',5,1700,'D-03'],
  ];
  const doctors = [];
  for (const [name,email,phone,specialization,department,qualification,experienceYears,consultationFee,roomNo] of doctorsInput) {
    const user = await User.create({ name, email, phone, role:'doctor', passwordHash });
    doctors.push(await Doctor.create({ user:user._id, specialization, department, qualification, experienceYears, consultationFee, roomNo, availability:[{day:'Mon',start:'09:00',end:'14:00'},{day:'Tue',start:'10:00',end:'15:00'},{day:'Thu',start:'09:00',end:'13:00'}] }));
  }
  await User.create({ name:'Dr. Pending Applicant', email:'pending.doctor@alhidayathospital.com', phone:'03000000016', role:'doctor', status:'pending', passwordHash, pendingDoctorProfile:{ specialization:'ENT', department:'ENT', qualification:'MBBS, FCPS Trainee', experienceYears:3, consultationFee:1500 } });

  const patientInput = [
    ['Ali Raza','patient@alhidayathospital.com','03000000021','male','B+','Multan'],
    ['Maham Noor','maham@alhidayathospital.com','03000000022','female','O+','Lahore'],
    ['Usman Tariq','usman@alhidayathospital.com','03000000023','male','A+','Islamabad'],
    ['Fatima Zahra','fatima@alhidayathospital.com','03000000024','female','AB+','Karachi'],
    ['Zain Ali','zain@alhidayathospital.com','03000000025','male','O-','Faisalabad'],
    ['Iqra Shah','iqra@alhidayathospital.com','03000000026','female','A-','Rawalpindi'],
    ['Ahmed Raza','ahmed.patient@alhidayathospital.com','03000000027','male','B-','Peshawar'],
    ['Hareem Aslam','hareem@alhidayathospital.com','03000000028','female','unknown','Quetta'],
  ];
  const patients = [];
  for (let i=0;i<patientInput.length;i++) {
    const [name,email,phone,gender,bloodGroup,city] = patientInput[i];
    const user = await User.create({ name, email, phone, role:'patient', passwordHash });
    patients.push(await Patient.create({ user:user._id, fullName:name, gender, phone, email, bloodGroup, address:`${city}, Pakistan`, allergies:i%3===0?['Penicillin']:[], emergencyContact:{name:'Family Contact', relation:'Family', phone:'03111111111'}, registeredBy: receptionist._id }));
  }

  const appointments = [];
  const statuses = ['confirmed','pending','completed','cancelled','confirmed','pending','completed','confirmed','no-show','confirmed'];
  for (let i=0;i<12;i++) {
    const doctor = doctors[i % doctors.length];
    const patient = patients[i % patients.length];
    const startHour = 9 + (i % 5);
    const endHour = startHour;
    const startMins = '00';
    const endMins = '30';
    const amPm = startHour >= 12 ? 'PM' : 'AM';
    const formattedStartHour = startHour > 12 ? startHour - 12 : startHour;
    const formattedEndHour = endHour > 12 ? endHour - 12 : endHour;
    const timeStr = `${String(formattedStartHour).padStart(2, '0')}:${startMins} ${amPm} - ${String(formattedEndHour).padStart(2, '0')}:${endMins} ${amPm}`;
    appointments.push(await Appointment.create({ patient: patient._id, doctor: doctor._id, appointmentDate: daysFromNow(i+1, startHour), timeSlot: timeStr, reason: ['Routine checkup','Follow-up visit','Fever and weakness','Back pain','Skin allergy'][i%5], status: statuses[i%statuses.length], createdBy: i%2 ? patient.user : receptionist._id }));
  }

  for (const record of [
    { patient: patients[0]._id, doctor: doctors[0]._id, appointment: appointments[0]._id, symptoms:['Chest pain','Fatigue'], diagnosis:'Mild hypertension', treatmentNotes:'Lifestyle changes and BP monitoring advised.', labAdvice:['CBC','ECG'], prescription:[{medicineName:'Atenolol 50mg', dosage:'50mg', frequency:'Once daily', duration:'14 days', instructions:'After breakfast'}], followUpDate: daysFromNow(14) },
    { patient: patients[2]._id, doctor: doctors[3]._id, appointment: appointments[2]._id, symptoms:['Back pain'], diagnosis:'Muscle strain', treatmentNotes:'Rest and physiotherapy.', labAdvice:['X-Ray Lumbar Spine'], prescription:[{medicineName:'Paracetamol 500mg', dosage:'500mg', frequency:'Twice daily', duration:'5 days', instructions:'After meal'}], followUpDate: daysFromNow(10) },
    { patient: patients[3]._id, doctor: doctors[2]._id, appointment: appointments[3]._id, symptoms:['Fever','Cough'], diagnosis:'Viral infection', treatmentNotes:'Hydration and rest.', labAdvice:['CBC'], prescription:[{medicineName:'Paracetamol 500mg', dosage:'500mg', frequency:'Every 8 hours', duration:'3 days', instructions:'If fever'}], followUpDate: daysFromNow(7) },
  ]) await MedicalRecord.create(record);

  const meds = await Medicine.insertMany([
    { name:'Atenolol 50mg', category:'Cardiac', batchNo:'AT-2026-A', quantity:8, price:45, expiryDate:'2027-12-31', lowStockLimit:10, supplier:'MediSupply' },
    { name:'Paracetamol 500mg', category:'Painkiller', batchNo:'PCM-2026-B', quantity:220, price:8, expiryDate:'2028-01-31', lowStockLimit:30, supplier:'HealthLine' },
    { name:'Amoxicillin 250mg', category:'Antibiotic', batchNo:'AMX-2026-C', quantity:60, price:20, expiryDate:'2027-06-30', lowStockLimit:20, supplier:'CarePharma' },
    { name:'Cetirizine 10mg', category:'Allergy', batchNo:'CET-2026-D', quantity:15, price:12, expiryDate:'2027-02-28', lowStockLimit:25, supplier:'CarePharma' },
    { name:'Omeprazole 20mg', category:'Gastro', batchNo:'OMP-2026-E', quantity:95, price:18, expiryDate:'2028-05-31', lowStockLimit:20, supplier:'MediSupply' },
    { name:'ORS Sachet', category:'General', batchNo:'ORS-2026-F', quantity:140, price:25, expiryDate:'2027-09-30', lowStockLimit:40, supplier:'HealthLine' },
  ]);

  for (const invoice of [
    { patient: patients[0]._id, appointment: appointments[0]._id, items:[{type:'consultation', description:'Cardiology consultation', quantity:1, unitPrice:2500},{type:'medicine', description:'Atenolol 50mg', quantity:10, unitPrice:45, medicine: meds[0]._id}], discount:100, paidAmount:1500, paymentMethod:'cash', createdBy: admin._id },
    { patient: patients[2]._id, appointment: appointments[2]._id, items:[{type:'consultation', description:'Orthopedic consultation', quantity:1, unitPrice:2200},{type:'service', description:'X-Ray', quantity:1, unitPrice:1200}], discount:0, paidAmount:3400, paymentMethod:'card', createdBy: admin._id },
    { patient: patients[3]._id, appointment: appointments[3]._id, items:[{type:'consultation', description:'Pediatric consultation', quantity:1, unitPrice:1800},{type:'medicine', description:'Paracetamol', quantity:12, unitPrice:8, medicine: meds[1]._id}], discount:50, paidAmount:0, paymentMethod:'none', createdBy: admin._id },
  ]) await Invoice.create(invoice);

  for (const report of [
    { patient: patients[0]._id, doctor: doctors[0]._id, testName: 'CBC (Complete Blood Count)', status: 'completed', resultSummary: 'Hemoglobin: 14.5 g/dL, WBC: 7,200/mcL, Platelets: 250,000/mcL. All values within normal limits.', technicianNotes: 'Performed using automated analyzer.', cost: 800, paymentStatus: 'paid', performedAt: new Date() },
    { patient: patients[0]._id, doctor: doctors[0]._id, testName: 'ECG (Electrocardiogram)', status: 'pending', cost: 1200, paymentStatus: 'unpaid' },
    { patient: patients[2]._id, doctor: doctors[3]._id, testName: 'X-Ray Lumbar Spine', status: 'completed', resultSummary: 'No fracture or dislocation seen. Normal lumbar lordosis.', technicianNotes: 'L-spine AP & Lateral views.', cost: 1500, paymentStatus: 'paid', performedAt: new Date() },
    { patient: patients[3]._id, doctor: doctors[2]._id, testName: 'Renal Function Test', status: 'pending', cost: 1800, paymentStatus: 'unpaid' },
  ]) await LabReport.create(report);

  await Notification.insertMany([
    { role:'pharmacist', title:'Low stock alert', message:'Atenolol 50mg and Cetirizine 10mg are below low stock limit', type:'inventory' },
    { role:'admin', title:'Doctor approval pending', message:'Dr. Pending Applicant is waiting for approval', type:'system' },
    { role:'receptionist', title:'Today appointments', message:'Multiple appointments are scheduled for confirmation', type:'appointment' },
  ]);

  const bedsData = [
    { bedNumber: 'GEN-A1', roomNumber: 'Ward A', type: 'general', status: 'available', pricePerDay: 500 },
    { bedNumber: 'GEN-A2', roomNumber: 'Ward A', type: 'general', status: 'available', pricePerDay: 500 },
    { bedNumber: 'GEN-B1', roomNumber: 'Ward B', type: 'general', status: 'occupied', pricePerDay: 600 },
    { bedNumber: 'PVT-201', roomNumber: 'Room 201', type: 'private', status: 'available', pricePerDay: 2500 },
    { bedNumber: 'PVT-202', roomNumber: 'Room 202', type: 'private', status: 'occupied', pricePerDay: 2500 },
    { bedNumber: 'ICU-1', roomNumber: 'ICU Unit', type: 'icu', status: 'available', pricePerDay: 6000 },
    { bedNumber: 'ICU-2', roomNumber: 'ICU Unit', type: 'icu', status: 'maintenance', pricePerDay: 6000 },
  ];
  const beds = [];
  for (const bedVal of bedsData) {
    beds.push(await Bed.create(bedVal));
  }

  const admissionInput = [
    {
      patient: patients[1]._id,
      bed: beds[2]._id,
      doctor: doctors[0]._id,
      admissionDate: daysFromNow(-3),
      reason: 'Pneumonia observation',
      status: 'admitted'
    },
    {
      patient: patients[4]._id,
      bed: beds[4]._id,
      doctor: doctors[1]._id,
      admissionDate: daysFromNow(-5),
      reason: 'Post-surgery recovery',
      status: 'admitted'
    },
    {
      patient: patients[5]._id,
      bed: beds[3]._id,
      doctor: doctors[2]._id,
      admissionDate: daysFromNow(-8),
      dischargeDate: daysFromNow(-6),
      reason: 'Dehydration',
      status: 'discharged',
      dischargeNotes: 'Rehydrated and discharged home.',
      totalPrice: 5000
    }
  ];
  for (const adm of admissionInput) {
    await Admission.create(adm);
  }

  await Invoice.create({
    patient: patients[5]._id,
    appointment: null,
    items: [{
      type: 'service',
      description: `Room Charges (Bed: PVT-201, Type: private) - 2 day(s)`,
      quantity: 1,
      unitPrice: 5000
    }],
    discount: 0,
    paidAmount: 5000,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    createdBy: admin._id
  });
  console.log('Seed completed. Demo password for all accounts: Password@123');
  console.log('Try: admin@alhidayathospital.com, hidayat@alhidayathospital.com, patient@alhidayathospital.com');
  process.exit(0);
}
seed().catch(err => { console.error(err); process.exit(1); });
