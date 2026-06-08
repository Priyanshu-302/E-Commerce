const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/pg/user.model");
const { TokenModel } = require("../models/pg/token.model");
const { asyncWrapper } = require("../utils/asyncWrapper");
const { AppError } = require("../utils/errors/AppError");

// Generate the access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

// Generate the refresh token
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// Register User
const register = asyncWrapper(async (req, res, next) => {
  const { email, password, firstName, lastName, phone, role } = req.body;

  // Check if user exists or not
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    return next(new AppError("User already exists", 400));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the new user
  const newUser = await UserModel.create({
    email,
    passwordHash: hashedPassword,
    firstName,
    lastName,
    phone,
    role,
  });

  res.status(201).json({
    status: "success",
    message: "Registration successful.",
    user: newUser,
  });
});

// Login user
const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  // Retrieve the user
  const user = await UserModel.findByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return next(new AppError("Invalid email or password", 400));
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save the tokens
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  await TokenModel.save({
    userId: user.id,
    token: refreshToken,
    expiresAt: expiryDate,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: "success",
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
  });
});

// Refresh the token
const refresh = asyncWrapper(async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return next(
      new AppError("No refresh session found. Please log in again.", 401),
    );
  }

  const savedToken = await TokenModel.find(token);
  if (!savedToken) {
    return next(
      new AppError("Invalid or expired session. Please log in again.", 401),
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return next(new AppError("User session no longer exists.", 401));
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await TokenModel.delete(token);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    await TokenModel.save({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: expiryDate,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: "success",
      accessToken: newAccessToken,
    });
  } catch (error) {
    await TokenModel.delete(token);
    return next(
      new AppError("Invalid session token. Please log in again.", 401),
    );
  }
});

// Logout user
const logout = asyncWrapper(async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return next(new AppError("No refresh session found.", 401));
  }

  res.clearCookie("refreshToken");
  res.status(200).json({
    status: "success",
    message: "Successfully logged out.",
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
};
