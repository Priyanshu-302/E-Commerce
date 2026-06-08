const express = require("express");
const authRoutes = require("./auth.routes.js");
const catalogRoutes = require("./catalog.routes.js");
const cartRoutes = require("./cart.routes.js");
const orderRoutes = require("./order.routes.js");
const webhookRoutes = require("./webhook.routes.js");
const addressRoutes = require("./address.routes.js"); 

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", catalogRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/addresses", addressRoutes); 

module.exports = router;
