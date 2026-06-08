const jwt = require("jsonwebtoken");
const { AppError } = require("../utils/errors/AppError");
const { UserModel } = require("../models/pg/user.model");

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Authentication failed: Missing token.", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const currentUser = await UserModel.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          "The user associated with this session no longer exists.",
          401,
        ),
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please log in again.", 401));
    }
    next(error);
  }
};

module.exports = { authMiddleware };