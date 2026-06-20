import Medicine from '../models/Medicine.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, ok } from '../utils/apiResponse.js';
import { buildPagination, regexSearch } from '../utils/query.js';

export const listMedicines = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const filter = {};
  if (req.query.search) filter.$or = [{ name: regexSearch(req.query.search) }, { category: regexSearch(req.query.search) }, { batchNo: regexSearch(req.query.search) }];
  if (req.query.lowStock === 'true') filter.$expr = { $lte: ['$quantity', '$lowStockLimit'] };
  const [items, total] = await Promise.all([Medicine.find(filter).sort('name').skip(skip).limit(limit), Medicine.countDocuments(filter)]);
  ok(res, items, 'Medicines fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const createMedicine = asyncHandler(async (req, res) => {
  const med = await Medicine.create(req.body);
  ok(res, med, 'Medicine added', 201);
});

export const updateMedicine = asyncHandler(async (req, res) => {
  const med = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!med) throw new ApiError('Medicine not found', 404);
  if (med.quantity <= med.lowStockLimit) await Notification.create({ role: 'pharmacist', title: 'Low stock alert', message: `${med.name} stock is low`, type: 'inventory' });
  ok(res, med, 'Medicine updated');
});

export const issueMedicine = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) throw new ApiError('Items are required', 400);
  const updated = [];
  for (const item of items) {
    const med = await Medicine.findById(item.medicine);
    if (!med) throw new ApiError('Medicine not found', 404);
    if (med.quantity < item.quantity) throw new ApiError(`Insufficient stock for ${med.name}`, 400);
    med.quantity -= item.quantity;
    await med.save();
    updated.push(med);
  }
  ok(res, updated, 'Medicines issued and inventory updated');
});
