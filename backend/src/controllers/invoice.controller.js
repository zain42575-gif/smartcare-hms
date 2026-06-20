import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { buildPagination } from '../utils/query.js';
import * as billingService from '../services/billingService.js';

export const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const { items, total } = await billingService.listInvoicesService(req.user, req.query, skip, limit);
  ok(res, items, 'Invoices fetched', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await billingService.createInvoiceService(req.body, req.user);
  ok(res, invoice, 'Invoice created', 201);
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await billingService.updateInvoiceService(req.params.id, req.body, req.user);
  ok(res, invoice, 'Invoice updated');
});
