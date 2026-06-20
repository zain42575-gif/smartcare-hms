import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';
import Patient from '../models/Patient.js';
import { ApiError } from '../utils/apiResponse.js';

export const listInvoicesService = async (user, query, skip, limit) => {
  const filter = {};
  if (query.status) filter.paymentStatus = query.status;
  if (query.patient) filter.patient = query.patient;
  if (user.role === 'patient') { 
    const p = await Patient.findOne({ user: user._id }); 
    filter.patient = p?._id || null; 
  }
  
  const [items, total] = await Promise.all([
    Invoice.find(filter).populate('patient','fullName patientId phone').sort('-createdAt').skip(skip).limit(limit),
    Invoice.countDocuments(filter),
  ]);
  
  return { items, total };
};

export const createInvoiceService = async (data, user) => {
  if (user.role === 'patient') throw new ApiError('Patients can view bills but cannot create invoices', 403);
  
  const invoice = await Invoice.create({ ...data, createdBy: user._id });
  
  if (invoice.paymentStatus !== 'paid') {
    await Notification.create({ 
      role: 'accountant', 
      title: 'Pending bill', 
      message: `Invoice ${invoice.invoiceNo} is ${invoice.paymentStatus}`, 
      type: 'billing' 
    });
  }
  
  return invoice;
};

export const updateInvoiceService = async (id, data, user) => {
  if (user.role === 'patient') throw new ApiError('Patients can view bills but cannot update invoices', 403);
  
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError('Invoice not found', 404);
  
  if (invoice.locked) {
    if (data.locked === false && user.role !== 'admin') {
       throw new ApiError('Only an admin can unlock an invoice', 403);
    }
    if (data.locked !== false) {
       throw new ApiError('Invoice is locked and cannot be modified', 403);
    }
  }
  
  Object.assign(invoice, data);
  await invoice.save();
  
  return invoice;
};
