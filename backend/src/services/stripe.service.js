const Stripe = require('stripe');
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'; // Provide dummy for startup if missing
const stripe = new Stripe(stripeKey);

/**
 * Create a Stripe Checkout Session
 * @param {Object} item - { id, name, description, amount, type }
 * @param {string} customerEmail - Email of the customer
 * @param {string} successUrl - URL to redirect on success
 * @param {string} cancelUrl - URL to redirect on cancel
 * @returns {Promise<Object>} - Stripe session object
 */
exports.createCheckoutSession = async ({ id, name, description, amount, type }, customerEmail, successUrl, cancelUrl) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: name,
                            description: description || `Purchase of ${name}`,
                            metadata: {
                                itemId: id,
                                type: type // 'artwork' or 'course'
                            }
                        },
                        unit_amount: Math.round(amount * 100), // amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer_email: customerEmail,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                itemId: id,
                type: type
            }
        });

        return session;
    } catch (error) {
        console.error('Stripe session creation error:', error);
        throw error;
    }
};

exports.stripe = stripe;
