const { asyncWrapper } = require("../utils/asyncWrapper.js");
const { OrderModel } = require("../models/pg/order.model.js");
const { UserModel } = require("../models/pg/user.model.js");
const { StripeService } = require("../services/stripe.service.js");
const { MailService } = require("../services/email.service.js");

// Handle stripe webhook
const handleStripeWebhook = asyncWrapper(async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = StripeService.constructEvent(req.rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("⚠️ Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the transaction events
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    const userId = paymentIntent.metadata.userId;

    console.log(`💰 Payment success received for Order ID: ${orderId}`);

    const updatedOrder = await OrderModel.updateStatus(
      orderId,
      "paid",
      paymentIntent.id,
    );

    // Send confirmation email
    const user = await UserModel.findById(userId);
    if (user && updatedOrder) {
      await MailService.sendConfirmation(user.email, updatedOrder);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    console.warn(`❌ Payment failed for Order ID: ${orderId}`);

    // Update status to failed
    await OrderModel.updateStatus(orderId, "failed");
  }

  res.status(200).json({ received: true });
});

module.exports = {
  handleStripeWebhook,
};
