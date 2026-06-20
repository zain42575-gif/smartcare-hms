export function buildPagination(req) {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

export function regexSearch(value) {
  return value ? new RegExp(String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
}
