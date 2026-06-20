import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['consultation','service','medicine','other'], required: true },
  description: String,
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, unique: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  items: [invoiceItemSchema],
  discount: { type: Number, default: 0, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  paymentMethod: { type: String, enum: ['cash','card','bank','online','none'], default: 'none' },
  paymentStatus: { type: String, enum: ['unpaid','partially-paid','paid'], default: 'unpaid', index: true },
  locked: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

invoiceSchema.virtual('totalAmount').get(function() {
  const subtotal = this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return Math.max(subtotal - this.discount, 0);
});

invoiceSchema.virtual('balanceDue').get(function() {
  const total = this.totalAmount;
  return Math.max(total - this.paidAmount, 0);
});
invoiceSchema.pre('save', function(next) {
  if (!this.invoiceNo) this.invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
  const total = this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) - this.discount;
  this.paymentStatus = this.paidAmount <= 0 ? 'unpaid' : this.paidAmount < total ? 'partially-paid' : 'paid';
  if (this.paymentStatus === 'paid') {
    this.locked = true;
  }
  next();
});
invoiceSchema.set('toJSON', { virtuals: true });
export default mongoose.model('Invoice', invoiceSchema);
