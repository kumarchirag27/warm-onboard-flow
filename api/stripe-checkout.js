// api/stripe-checkout.js
// Creates a Stripe Checkout session for the Individual Pro plan.
//
// POST { email }
// Returns { url } — frontend redirects to Stripe Checkout
//
// Required env vars:
//   STRIPE_SECRET_KEY    — Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_PRO_PRICE_ID  — Price ID for $4/month Individual Pro subscription

const SITE_URL = process.env.SITE_URL || 'https://ai-dlp.sentrashield.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY   = process.env.STRIPE_SECRET_KEY   || '';
  const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || '';

  if (!STRIPE_SECRET_KEY)   return res.status(500).json({ error: 'Stripe not configured' });
  if (!STRIPE_PRO_PRICE_ID) return res.status(500).json({ error: 'Stripe price not configured' });

  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer_email':                   email,
        'mode':                             'subscription',
        'line_items[0][price]':             STRIPE_PRO_PRICE_ID,
        'line_items[0][quantity]':          '1',
        'success_url':                      `${SITE_URL}/personal?activated=1`,
        'cancel_url':                       `${SITE_URL}/personal`,
        'subscription_data[metadata][email]': email,
        'metadata[email]':                  email,
        'allow_promotion_codes':            'true',
      }).toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error('Stripe error:', session);
      return res.status(502).json({ error: session.error?.message || 'Stripe error' });
    }

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('stripe-checkout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
