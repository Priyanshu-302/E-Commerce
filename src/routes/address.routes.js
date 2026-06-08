const express = require("express");
const {
  addAddress,
  getMyAddresses,
} = require("../controllers/address.controller.js");
const { authMiddleware } = require("../middlewares/auth.middleware.js");
const { validate } = require("../middlewares/validate.middleware.js");
const { addressSchema } = require("../utils/validators.js");

const router = express.Router();

// All address endpoints require the user to be logged in
router.use(authMiddleware);

router.post("/", validate(addressSchema), addAddress);
router.get("/", getMyAddresses);

module.exports = router;
