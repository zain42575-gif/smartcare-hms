export const ok = (res, data = null, message = 'Success', statusCode = 200, meta = undefined) =>
  res.status(statusCode).json({ success: true, message, data, ...(meta ? { meta } : {}) });

export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
