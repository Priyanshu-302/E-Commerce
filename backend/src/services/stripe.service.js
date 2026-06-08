const Stripe = require("stripe");

// Initialize stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const StripeService = {
  // Create a Stripe Payment Intent
  async createPaymentIntent(amount, currency = "inr", metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // 1 INR = 100 paise
        currency,
        metadata,
      });

      return paymentIntent;
    } catch (error) {
      throw new Error(`Stripe Payment Error: ${error.message}`);
    }
  },

  // Retrieve the details of transaction
  async retrievePaymentIntent(paymentIntentId) {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      throw new Error(`Stripe Retrieval Error: ${error.message}`);
    }
  },

  // Construct stripe webhooks
  constructEvent(rawBody, signature, webhookSecret) {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  },
};

module.exports = { StripeService };
