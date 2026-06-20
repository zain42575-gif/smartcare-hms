import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  batchNo: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date, required: true, index: true },
  lowStockLimit: { type: Number, default: 10 },
  supplier: String,
}, { timestamps: true });

medicineSchema.virtual('isLowStock').get(function() { return this.quantity <= this.lowStockLimit; });
medicineSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Medicine', medicineSchema);
