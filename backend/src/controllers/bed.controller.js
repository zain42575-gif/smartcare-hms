import Bed from '../models/Bed.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, ok } from '../utils/apiResponse.js';
import { buildPagination, regexSearch } from '../utils/query.js';

export const listBeds = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) {
    filter.$or = [
      { bedNumber: regexSearch(req.query.search) },
      { roomNumber: regexSearch(req.query.search) }
    ];
  }

  const [items, total] = await Promise.all([
    Bed.find(filter).sort('bedNumber').skip(skip).limit(limit),
    Bed.countDocuments(filter)
  ]);
  ok(res, items, 'Beds fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const createBed = asyncHandler(async (req, res) => {
  const { bedNumber, roomNumber, type, pricePerDay, status } = req.body;
  if (!bedNumber || !roomNumber || !type || pricePerDay === undefined) {
    throw new ApiError('Bed number, room number, type, and price per day are required', 400);
  }
  const existing = await Bed.findOne({ bedNumber });
  if (existing) throw new ApiError('Bed number already exists', 400);

  const bed = await Bed.create({ bedNumber, roomNumber, type, pricePerDay, status });
  ok(res, bed, 'Bed created', 201);
});

export const updateBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findById(req.params.id);
  if (!bed) throw new ApiError('Bed not found', 404);

  if (req.body.bedNumber && req.body.bedNumber !== bed.bedNumber) {
    const existing = await Bed.findOne({ bedNumber: req.body.bedNumber });
    if (existing) throw new ApiError('Bed number already exists', 400);
  }

  Object.assign(bed, req.body);
  await bed.save();
  ok(res, bed, 'Bed updated');
});
