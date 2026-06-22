import Stripe  from 'stripe';

// Instantiate Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_51PxXXXXXX", {
  apiVersion: "2023-10-16", // Lock API version for absolute stability
});

/**
 * Stripe Payment service wrapper
 */
class StripeService {
  /**
   * Generates a new Stripe PaymentIntent for secure frontend checkout
   * @param {number} amount - Total payable amount in sub-units (e.g. Paise for INR, Cents for USD)
   * @param {string} currency - Standard 3-letter currency code (e.g. 'inr')
   * @param {object} metadata - Custom transaction metadata snapshots (e.g. orderId, userId)
   */
  static async createPaymentIntent(amount, currency = "inr", metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Math.round to prevent decimals in currency subunit
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return paymentIntent;
    } catch (error) {
      console.error("[Stripe Service Error] PaymentIntent creation failed:", error.message);
      throw new Error(`Stripe Payment Integration failed: ${error.message}`);
    }
  }

  /**
   * Fetches a Stripe PaymentIntent by its identifier to verify state
   * @param {string} paymentIntentId - The payment intent ID
   */
  static async retrievePaymentIntent(paymentIntentId) {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error("[Stripe Service Error] Retrieving PaymentIntent failed:", error.message);
      throw new Error(`Stripe Retrieval failed: ${error.message}`);
    }
  }
}

export default StripeService;
