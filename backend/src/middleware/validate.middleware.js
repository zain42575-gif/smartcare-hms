export const validate = (schema) => (req, res, next) => {
  try {
    const data = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Replace req.body etc with parsed (and optionally transformed/stripped) data
    req.body = data.body;
    req.query = data.query;
    req.params = data.params;
    next();
  } catch (error) {
    next(error); // This will pass the ZodError to the global error handler
  }
};
