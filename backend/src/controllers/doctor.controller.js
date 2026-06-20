import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, ok } from '../utils/apiResponse.js';
import { buildPagination, regexSearch } from '../utils/query.js';

import { getCache, setCache } from '../utils/cache.js';

export const listDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const filter = {};
  if (req.query.department) filter.department = regexSearch(req.query.department);
  if (req.query.specialization) filter.specialization = regexSearch(req.query.specialization);
  if (req.query.search) {
    const searchRegex = regexSearch(req.query.search);
    const matchingUsers = await User.find({ name: searchRegex, role: 'doctor' }).distinct('_id');
    filter.$or = [
      { user: { $in: matchingUsers } },
      { department: searchRegex },
      { specialization: searchRegex }
    ];
  }
  
  const cacheKey = `doctors:${JSON.stringify(filter)}:${skip}:${limit}`;
  let data = getCache(cacheKey);
  
  if (!data) {
    const [items, total] = await Promise.all([
      Doctor.find(filter).populate('user','name email phone status').sort('department specialization').skip(skip).limit(limit).lean(),
      Doctor.countDocuments(filter),
    ]);
    data = { items, total };
    setCache(cacheKey, data, 60); // 60 seconds TTL
  }
  
  ok(res, data.items, 'Doctors fetched', 200, { page, limit, total: data.total, pages: Math.ceil(data.total / limit) });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, phone, specialization, department, consultationFee } = req.body;
  if (!name || !email || !password || !specialization || !department || consultationFee === undefined) throw new ApiError('Required doctor fields missing', 400);
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError('Email already exists', 409);
  const user = await User.create({ name, email, phone, role: 'doctor', passwordHash: password });
  const doctor = await Doctor.create({ ...req.body, user: user._id });
  clearCache('doctors:');
  ok(res, await doctor.populate('user','name email phone'), 'Doctor created', 201);
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('user','name email phone');
  if (!doctor) throw new ApiError('Doctor not found', 404);
  clearCache('doctors:');
  ok(res, doctor, 'Doctor updated');
});
