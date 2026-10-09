// Stripe Billing & Subscription Webhook Engine (USD $19/mo Pro & $99/mo Advisor)

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// Pricing Plans
const STRIPE_PLANS = {
  pro: {
    name: 'FinAgent Pro (US Market)',
    amountUSD: 19,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_us_pro_monthly_19',
  },
  advisor: {
    name: 'FinAgent Advisor OS (US Market)',
    amountUSD: 99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_ADVISOR_PRICE_ID || 'price_us_adv_monthly_99',
  },
  black: {
    name: 'FinAgent Black — Sovereign Virtual Family Office (Annual)',
    amountUSD: 2400,
    interval: 'year',
    stripePriceId: process.env.STRIPE_BLACK_PRICE_ID || 'price_us_black_annual_2400',
  },
};

// Mock invoice database for US users
let mockInvoices = [
  {
    id: 'in_us_91024',
    invoiceNumber: 'INV-US-2026-0041',
    date: '2026-09-01',
    amountUSD: 19.00,
    status: 'paid',
    plan: 'FinAgent Pro',
    period: 'Sep 01, 2026 – Oct 01, 2026',
    receiptUrl: 'https://pay.stripe.com/receipts/demo_inv_0041',
  },
  {
    id: 'in_us_82019',
    invoiceNumber: 'INV-US-2026-0012',
    date: '2026-08-01',
    amountUSD: 19.00,
    status: 'paid',
    plan: 'FinAgent Pro',
    period: 'Aug 01, 2026 – Sep 01, 2026',
    receiptUrl: 'https://pay.stripe.com/receipts/demo_inv_0012',
  },
];

// POST /api/stripe/create-checkout-session
async function createCheckoutSession(req, res) {
  try {
    const { tier = 'pro', successUrl, cancelUrl, customerEmail } = req.body;
    const plan = STRIPE_PLANS[tier] || STRIPE_PLANS.pro;

    if (stripe) {
      const lineItem = plan.stripePriceId && plan.stripePriceId.startsWith('price_1')
        ? { price: plan.stripePriceId, quantity: 1 }
        : {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: 'Full access to US Wash-Sale Harvester, W-2 Optimizer, Silicon Valley Equity OS, Plaid Sync & Living Trust.',
              },
              unit_amount: plan.amountUSD * 100,
              recurring: { interval: plan.interval },
            },
            quantity: 1,
          };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: 'subscription',
        success_url: successUrl || 'http://localhost:5173/app/invoices?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: cancelUrl || 'http://localhost:5173/app/invoices?canceled=true',
        customer_email: customerEmail,
      });

      return res.json({ success: true, url: session.url, sessionId: session.id });
    }

    // Sandbox / Development fallback
    const simulatedSessionId = `cs_sandbox_${Date.now()}`;
    res.json({
      success: true,
      url: successUrl ? `${successUrl}?session_id=${simulatedSessionId}` : 'http://localhost:5173/app/invoices?mock_upgraded=true',
      sessionId: simulatedSessionId,
      plan: plan.name,
      amountUSD: plan.amountUSD,
      amount: plan.amountUSD * 100,
      interval: plan.interval,
      message: 'Running in Stripe Sandbox Mode. Click redirect to complete upgrade.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/stripe/create-portal-session
async function createPortalSession(req, res) {
  try {
    const { customerId, returnUrl } = req.body;
    if (stripe && customerId) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || 'http://localhost:5173/app/invoices',
      });
      return res.json({ success: true, url: portal.url });
    }

    res.json({
      success: true,
      url: 'http://localhost:5173/app/invoices',
      message: 'Stripe Customer Portal (Sandbox preview).',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/stripe/invoices
async function getInvoices(req, res) {
  res.json({ success: true, invoices: mockInvoices });
}

// POST /api/stripe/webhook
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event = req.body;

  if (stripe && webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Signature Verification Error: ${err.message}`);
    }
  }

  // Handle Stripe events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('[Stripe Webhook] Checkout completed for:', session.customer_email);
      // Can add invoice
      mockInvoices.unshift({
        id: `in_${Date.now()}`,
        invoiceNumber: `INV-US-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        amountUSD: (session.amount_total || 1900) / 100,
        status: 'paid',
        plan: 'FinAgent Pro (Stripe)',
        period: 'Current Month',
        receiptUrl: session.receipt_url || 'https://pay.stripe.com/receipts/demo',
      });
      break;
    }
    case 'customer.subscription.deleted':
      console.log('[Stripe Webhook] Subscription cancelled:', event.data.object.id);
      break;
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

module.exports = { createCheckoutSession, createPortalSession, getInvoices, handleWebhook };
