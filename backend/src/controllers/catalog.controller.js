const { asyncWrapper } = require("../utils/asyncWrapper.js");
const { AppError } = require("../utils/errors/AppError.js");
const Product = require("../models/mongodb/product.model.js");
const Category = require("../models/mongodb/category.model.js");
const { InventoryModel } = require("../models/pg/inventory.model.js");

// Get Products
const getProducts = asyncWrapper(async (req, res, next) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 12,
  } = req.query;

  const queryObj = {};

  if (category) queryObj.categories = category; // Category ObjectId
  if (brand) queryObj.brand = brand;

  if (minPrice || maxPrice) {
    queryObj.base_price = {};
    if (minPrice) queryObj.base_price.$gte = Number(minPrice);
    if (maxPrice) queryObj.base_price.$lte = Number(maxPrice);
  }
  if (search) {
    // Requires setting up a text index in MongoDB on title/brand/description
    queryObj.$text = { $search: search };
  }
  // Paginate
  const skip = (Number(page) - 1) * Number(limit);
  const totalCount = await Product.countDocuments(queryObj);
  const products = await Product.find(queryObj)
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  res.status(200).json({
    status: "success",
    results: products.length,
    totalCount,
    page: Number(page),
    totalPages: Math.ceil(totalCount / Number(limit)),
    products,
  });
});

// Get product by id or slug
const getProductByIdOrSlug = asyncWrapper(async (req, res, next) => {
  const { lookup } = req.params; // Can be ObjectId or slug

  const isObjectId = lookup.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: lookup } : { slug: lookup };

  const product = await Product.findOne(query).populate(
    "categories",
    "name slug",
  );
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.status(200).json({
    status: "success",
    product,
  });
});

// Add a product (ADMIN)
const addProduct = asyncWrapper(async (req, res, next) => {
  const {
    title,
    description,
    brand,
    categories,
    base_price,
    attributes,
    variants,
    images,
  } = req.body;

  if (!images || images.length === 0) {
    return next(
      new AppError(
        "Please provide at least one product image URL object.",
        400,
      ),
    );
  }

  const newProduct = await Product.create({
    title,
    description,
    brand,
    categories,
    images,
    base_price: Number(base_price),
    attributes: attributes || [],
    variants: variants || [],
  });

  res.status(201).json({
    status: "success",
    product: newProduct,
  });
});

// Get all categories (ADMIN)
const getCategories = asyncWrapper(async (req, res, next) => {
  const categories = await Category.find().populate("parent_id", "name");

  res.status(200).json({
    status: "success",
    categories,
  });
});

// Update the inventory
const updateInventoryStock = asyncWrapper(async (req, res, next) => {
  const { sku, quantity } = req.body;
  if (!sku || quantity === undefined) {
    return next(new AppError("SKU and quantity are required.", 400));
  }
  const updatedInventory = await InventoryModel.updateStock(
    sku,
    Number(quantity),
  );
  res.status(200).json({
    status: "success",
    inventory: updatedInventory,
  });
});

// Get stock of a SKU (PUBLIC)
const getStock = asyncWrapper(async (req, res, next) => {
  const { sku } = req.params;
  const stock = await InventoryModel.getStock(sku);
  res.status(200).json({
    status: "success",
    sku,
    stock,
  });
});

module.exports = {
  getProducts,
  getProductByIdOrSlug,
  addProduct,
  getCategories,
  updateInventoryStock,
  getStock,
};
