const express = require("express");
const {
  checkout,
  getOrderDetails,
  getMyOrders,
  simulatePayment,
} = require("../controllers/order.controller.js");
const { authMiddleware } = require("../middlewares/auth.middleware.js");

const router = express.Router();

// Apply auth middleware to protect all routes in this file
router.use(authMiddleware);

router.post("/checkout", checkout);
router.get("/my-orders", getMyOrders);
router.post("/:orderId/simulate-payment", simulatePayment);
router.get("/:orderId", getOrderDetails);

module.exports = router;
