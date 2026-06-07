const { AppError } = require("../utils/errors/AppError");

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "Access Denied: You do not have permission for this action.",
          403,
        ),
      );
    }
    
    next();
  };
};

module.exports = { authorize };