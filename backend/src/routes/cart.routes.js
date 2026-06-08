const express = require("express");
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
} = require("../controllers/cart.controller.js");
const { authMiddleware } = require("../middlewares/auth.middleware.js");

const router = express.Router();

// Apply auth middleware to protect all routes in this file
router.use(authMiddleware);

router.get("/", getCart);
router.post("/items", addItemToCart);
router.put("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);

module.exports = router;
