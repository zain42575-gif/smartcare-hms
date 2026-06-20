import xss from 'xss';

export const xssClean = (req, res, next) => {
  if (req.body) req.body = cleanObj(req.body);
  if (req.query) req.query = cleanObj(req.query);
  if (req.params) req.params = cleanObj(req.params);
  next();
};

const cleanObj = (obj) => {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanObj);
  }
  if (typeof obj === 'object' && obj !== null) {
    const cleaned = {};
    for (const key in obj) {
      cleaned[key] = cleanObj(obj[key]);
    }
    return cleaned;
  }
  return obj;
};
