const express = require("express");
const {
  register,
  login,
  refresh,
  logout,
} = require("../controllers/auth.controller.js");
const { validate } = require("../middlewares/validate.middleware.js");
const { registerSchema, loginSchema } = require("../utils/validators.js");
const { authLimiter } = require("../middlewares/rateLimiter.js");

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
