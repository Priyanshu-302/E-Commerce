const { asyncWrapper } = require("../utils/asyncWrapper.js");
const { AppError } = require("../utils/errors/AppError.js");
const { CartModel } = require("../models/pg/cart.model.js");
const { InventoryModel } = require("../models/pg/inventory.model.js");
const Product = require("../models/mongodb/product.model.js");

// Get cart
const getCart = asyncWrapper(async (req, res, next) => {
  const cart = await CartModel.getOrCreate(req.user.id);
  const rawItems = await CartModel.getCartItems(cart.id);

  const items = []; // Connection of MongoDB and PostgreSQL

  for (const item of rawItems) {
    const product = await Product.findById(item.product_id);

    if (product) {
      // Find variant price if custom price override is specified
      const variant = product.variants.find((v) => v.sku === item.sku); // discounted price
      const price =
        variant && variant.price ? variant.price : product.base_price;

      items.push({
        id: item.id,
        productId: product_id,
        sku: item.sku,
        name: product.title,
        price,
        image:
          product.images.find((img) => img.is_primary)?.url ||
          product.images[0]?.url,
        quantity: item.quantity,
      });
    }
  }

  res.status(200).json({
    status: "success",
    cart: {
      id: cart.id,
      items: items,
    },
  });
});

// Add item to cart
const addItemToCart = asyncWrapper(async (req, res, next) => {
  const { productId, sku, quantity } = req.body;

  // Check stock is available or not in PostgreSQL
  const stock = await InventoryModel.getStock(sku);
  if (stock < quantity) {
    return next(
      new AppError(
        `Only ${stockAvailable} items left in stock for SKU ${sku}.`,
        400,
      ),
    );
  }

  // Check if product exists or not
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product does not exist in catalog.", 404));
  }

  // Create the cart and add the new item
  const cart = await CartModel.getOrCreate(req.user.id);
  const newItem = await CartModel.addItem({
    cartId: cart.id,
    productId,
    sku,
    quantity,
  });

  res.status(200).json({
    status: "success",
    item: newItem,
  });
});

// Update cart item
const updateCartItem = asyncWrapper(async (req, res, next) => {
  const { itemId } = req.params;
  const { sku, quantity } = req.body;

  // Check for stock
  const stock = await InventoryModel.getStock(sku);
  if (stock < quantity) {
    return next(
      new AppError(
        `Cannot update quantity. Only ${stockAvailable} items left in stock.`,
        400,
      ),
    );
  }

  // Get the cart
  const cart = await CartModel.getOrCreate(req.user.id);

  // Update the item
  const updatedItem = await CartModel.updateItemQuantity(
    cart.id,
    itemId,
    quantity,
  );

  res.status(200).json({
    status: "success",
    item: updatedItem,
  });
});

// Remove the item
const removeCartItem = asyncWrapper(async (req, res, next) => {
  const { itemId } = req.params;
  const cart = await CartModel.getOrCreate(req.user.id);
  await CartModel.removeItem(cart.id, itemId);

  res.status(200).json({
    status: "success",
    message: "Item removed from cart.",
  });
});

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
};
