import AuditLog from '../models/AuditLog.js';

export const audit = (action, moduleName) => async (req, res, next) => {
  res.on('finish', async () => {
    if (req.user && res.statusCode < 400) {
      await AuditLog.create({
        user: req.user._id,
        action,
        module: moduleName,
        description: `${req.method} ${req.originalUrl}`,
        ipAddress: req.ip,
      }).catch(() => {});
    }
  });
  next();
};
