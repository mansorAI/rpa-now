const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  personal: {
    name: 'الشخصية',
    priceId: process.env.STRIPE_PRICE_PERSONAL,
    price: 29,
    currency: 'usd',
    features: {
      max_automations: 5,
      max_runs_per_month: 500,
      ai_enabled: false,
      integrations: ['sms'],
    },
  },
  business: {
    name: 'الأعمال',
    priceId: process.env.STRIPE_PRICE_BUSINESS,
    price: 79,
    currency: 'usd',
    features: {
      max_automations: 50,
      max_runs_per_month: 10000,
      ai_enabled: true,
      integrations: ['sms', 'whatsapp', 'email'],
    },
  },
  enterprise: {
    name: 'المؤسسات',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    price: 199,
    currency: 'usd',
    features: {
      max_automations: -1,
      max_runs_per_month: -1,
      ai_enabled: true,
      integrations: ['sms', 'whatsapp', 'email', 'webhook'],
    },
  },
};

const createCustomer = async (email, name) => {
  return stripe.customers.create({ email, name });
};

const createCheckoutSession = async ({ customerId, priceId, workspaceId, successUrl, cancelUrl }) => {
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { workspaceId },
    allow_promotion_codes: true,
  });
};

const createPortalSession = async (customerId, returnUrl) => {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
};

const constructEvent = (payload, signature) => {
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

const cancelSubscription = async (subscriptionId) => {
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
};

module.exports = { stripe, PLANS, createCustomer, createCheckoutSession, createPortalSession, constructEvent, cancelSubscription };
