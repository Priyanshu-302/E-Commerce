const express = require("express");
const { handleStripeWebhook } = require("../controllers/webhook.controller.js");

const router = express.Router();

// Route for handling Stripe webhook calls.
// The raw body is captured in app.js using express.json()'s verify option.
router.post("/", handleStripeWebhook);

module.exports = router;
