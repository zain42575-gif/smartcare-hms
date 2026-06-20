import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { buildPagination } from '../utils/query.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const filter = req.query.module ? { module: req.query.module } : {};
  const [items, total] = await Promise.all([
    AuditLog.find(filter).populate('user','name email role').sort('-createdAt').skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  ok(res, items, 'Audit logs fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});
