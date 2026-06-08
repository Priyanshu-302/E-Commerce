const AppError = require("../utils/errors/AppError.js");

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((err) => err.message).join(" ");
      return next(new AppError(errors, 400));
    }
    
    req.body = result.data;
    next();
  };
};
module.exports = { validate };
