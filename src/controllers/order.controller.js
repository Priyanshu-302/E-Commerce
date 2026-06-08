const { asyncWrapper } = require("../utils/asyncWrapper.js");
const { AppError } = require("../utils/errors/AppError.js");
const { CartModel } = require("../models/pg/cart.model.js");
const { OrderModel } = require("../models/pg/order.model.js");
const { AddressModel } = require("../models/pg/address.model.js");
const Product = require("../models/mongodb/product.model.js");
const { StripeService } = require("../services/stripe.service.js");

// checkout
const checkout = asyncWrapper(async (req, res, next) => {
  const { addressId } = req.body;

  // Get the shipping address
  const shippingAddress = await AddressModel.findById(addressId, req.user.id);
  if (!shippingAddress) {
    return next(new AppError("Invalid shipping address.", 400));
  }

  // Fetch the cart
  const cart = await CartModel.getOrCreate(req.user.id);
  const cartItems = await CartModel.getCartItems(cart.id);

  if (cartItems.length === 0) {
    return next(new AppError("Cart is empty.", 400));
  }

  const checkoutItems = [];
  let totalAmount = 0;

  for (const item of cartItems) {
    const product = await Product.findById(item.product_id);
    if (!product) {
      return next(new AppError("Product does not exist in catalog.", 404));
    }

    const variant = product.variants.find((v) => v.sku === item.sku);
    const price = variant && variant.price ? variant.price : product.base_price;

    totalAmount += price * item.quantity;
    checkoutItems.push({
      productId: item.product_id,
      sku: item.sku,
      name: product.title,
      quantity: item.quantity,
      unit_price: price, // Match model's unit_price field
    });
  }

  // Create a new order (now outside the for loop)
  const newOrder = await OrderModel.createOrder({
    userId: req.user.id,
    totalAmount,
    shippingAddress,
    items: checkoutItems, // Changed from item to items
  });

  // Create the payment intent
  const paymentIntent = await StripeService.createPaymentIntent(
    totalAmount,
    "inr",
    {
      orderId: newOrder.id,
      userId: req.user.id,
    },
  );

  // Save the status
  await OrderModel.updateStatus(
    newOrder.id,
    "pending_payment",
    paymentIntent.id,
  );

  // Clear the cart
  await CartModel.clear(cart.id);

  res.status(200).json({
    status: "success",
    orderId: newOrder.id,
    clientSecret: paymentIntent.client_secret,
    amount: totalAmount,
  });
});

// Get the order details
const getOrderDetails = asyncWrapper(async (req, res, next) => {
  const { orderId } = req.params;

  const order = await OrderModel.findById(orderId);
  if (!order || order.user_id !== req.user.id) {
    return next(new AppError("Order not found.", 404));
  }

  res.status(200).json({
    status: "success",
    order,
  });
});

// Get my orders
const getMyOrders = asyncWrapper(async (req, res, next) => {
  const orders = await OrderModel.findByUserId(req.user.id);

  res.status(200).json({
    status: "success",
    orders,
  });
});

module.exports = {
  checkout,
  getOrderDetails,
  getMyOrders,
};
