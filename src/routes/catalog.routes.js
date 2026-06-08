const express = require("express");
const {
  getProducts,
  getProductByIdOrSlug,
  addProduct,
  getCategories,
  updateInventoryStock,
} = require("../controllers/catalog.controller.js");
const { authMiddleware } = require("../middlewares/auth.middleware.js");
const { authorize } = require("../middlewares/role.middleware.js");

const router = express.Router();

// Public routes (No authentication required)
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:lookup", getProductByIdOrSlug);

// Restricted Admin routes
router.post("/", authMiddleware, authorize("admin"), addProduct);
router.post(
  "/inventory",
  authMiddleware,
  authorize("admin"),
  updateInventoryStock,
);

module.exports = router;
