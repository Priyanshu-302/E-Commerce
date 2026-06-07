const { AppError } = require("../utils/errors/AppError");

// Send error in development phase
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send error in production phase
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Unexpected developer bug (e.g. db syntax error)
    console.error("CRITICAL SYSTEM ERROR:", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong on our end.",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.isOperational = err.isOperational;
    // Handle common raw PostgreSQL errors
    if (err.code === "22P02") {
      error = new AppError("Invalid ID query format.", 400);
    }
    if (err.code === "23505") {
      error = new AppError("This record already exists.", 409); // Unique constraint violation
    }
    // Handle common Mongoose database errors
    if (err.name === "CastError") {
      error = new AppError(`Invalid request value path: ${err.path}`, 400);
    }
    sendErrorProd(error, res);
  }
};
