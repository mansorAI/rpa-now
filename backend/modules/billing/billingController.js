const { query } = require('../../config/database');
const { PLANS, createCustomer, createCheckoutSession, createPortalSession, constructEvent, cancelSubscription } = require('./stripeService');

const getPlans = (req, res) => {
  res.json({ plans: PLANS });
};

const getSubscription = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM subscriptions WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.workspace.id]
    );
    res.json({ subscription: rows[0] || null, plans: PLANS });
  } catch (err) {
    next(err);
  }
};

const createCheckout = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'الخطة غير موجودة' });

    let customerId;
    const { rows } = await query('SELECT stripe_customer_id FROM subscriptions WHERE workspace_id = $1 LIMIT 1', [req.workspace.id]);

    if (rows[0]?.stripe_customer_id) {
      customerId = rows[0].stripe_customer_id;
    } else {
      const customer = await createCustomer(req.user.email, req.user.full_name);
      customerId = customer.id;
    }

    const session = await createCheckoutSession({
      customerId,
      priceId: PLANS[plan].priceId,
      workspaceId: req.workspace.id,
      successUrl: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancelUrl: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};

const createPortal = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT stripe_customer_id FROM subscriptions WHERE workspace_id = $1 LIMIT 1', [req.workspace.id]);
    if (!rows[0]?.stripe_customer_id) return res.status(400).json({ error: 'لا توجد اشتراك نشط' });

    const session = await createPortalSession(
      rows[0].stripe_customer_id,
      `${process.env.FRONTEND_URL}/subscription`
    );
    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = constructEvent(req.body, sig);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const workspaceId = data.metadata.workspaceId;
        const subId = data.subscription;
        const customerId = data.customer;

        const { stripe } = require('./stripeService');
        const sub = await stripe.subscriptions.retrieve(subId);
        const priceId = sub.items.data[0].price.id;
        const plan = Object.keys(PLANS).find(k => PLANS[k].priceId === priceId) || 'personal';

        await query(
          `INSERT INTO subscriptions (workspace_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_start, current_period_end)
           VALUES ($1, $2, $3, $4, $5, to_timestamp($6), to_timestamp($7))
           ON CONFLICT (stripe_subscription_id) DO UPDATE
           SET status = $5, plan = $4`,
          [workspaceId, customerId, subId, plan, 'active',
            sub.current_period_start, sub.current_period_end]
        );
        await query('UPDATE workspaces SET plan = $1 WHERE id = $2', [plan, workspaceId]);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const status = event.type === 'customer.subscription.deleted' ? 'canceled' : data.status;
        await query(
          'UPDATE subscriptions SET status = $1, cancel_at_period_end = $2 WHERE stripe_subscription_id = $3',
          [status, data.cancel_at_period_end, data.id]
        );
        break;
      }

      case 'invoice.payment_succeeded': {
        await query(
          `INSERT INTO transactions (workspace_id, stripe_payment_intent_id, amount, currency, status, description)
           SELECT workspace_id, $1, $2, $3, 'succeeded', 'اشتراك شهري'
           FROM subscriptions WHERE stripe_customer_id = $4`,
          [data.payment_intent, data.amount_paid / 100, data.currency, data.customer]
        );
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.json({ received: true });
};

const getTransactions = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM transactions WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.workspace.id]
    );
    res.json({ transactions: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlans, getSubscription, createCheckout, createPortal, handleWebhook, getTransactions };
