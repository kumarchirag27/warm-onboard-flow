// api/stripe-webhook.js
// Handles Stripe webhook events for the Individual Pro plan.
//
// POST (raw body — Stripe-Signature header required)
//
// Events handled:
//   checkout.session.completed    → generate license key, store in DB, send email
//   customer.subscription.deleted → mark license as cancelled
//
// Required env vars:
//   STRIPE_SECRET_KEY      — Stripe secret key
//   STRIPE_WEBHOOK_SECRET  — Stripe webhook signing secret (whsec_...)
//   SUPABASE_URL           — Supabase project URL
//   SUPABASE_SERVICE_KEY   — service role key
//   RESEND_API_KEY         — for sending license key email
//   RESEND_FROM            — from address (default: SentraShield <noreply@sentrashield.com>)

import crypto from 'crypto';

// CRITICAL: Disable Vercel's automatic JSON body parsing.
// Stripe signature verification requires the raw, unmodified request bytes.
// If Vercel parses the body first, JSON.stringify re-serialisation changes
// whitespace/key order and the HMAC check will always fail (400 Invalid signature).
export const config = {
  api: { bodyParser: false },
};

const SITE_URL = process.env.SITE_URL || 'https://ai-dlp.sentrashield.com';

// Read the full raw body from the request stream into a string.
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end',  ()    => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ── Stripe webhook signature verification (no SDK needed) ──────
function verifyStripeSignature(payload, sigHeader, secret) {
  const parts       = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const timestamp   = parts['t'];
  const signatures  = sigHeader.match(/v1=([a-f0-9]+)/g)?.map(s => s.slice(3)) || [];
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  return signatures.some(sig => crypto.timingSafeEqual(
    Buffer.from(sig,      'hex'),
    Buffer.from(expected, 'hex')
  ));
}

// ── License key generator ──────────────────────────────────────
function generateLicenseKey() {
  return 'ss_ind_' + crypto.randomBytes(16).toString('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY     = process.env.STRIPE_SECRET_KEY     || '';
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
  const SUPABASE_URL          = process.env.SUPABASE_URL          || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
  const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY  || '';
  const RESEND_API_KEY        = process.env.RESEND_API_KEY        || '';
  const RESEND_FROM           = process.env.RESEND_FROM           || 'SentraShield <noreply@sentrashield.com>';

  if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // ── Verify Stripe signature ───────────────────────────────────
  const sigHeader = req.headers['stripe-signature'] || '';
  const rawBody = await getRawBody(req);

  if (!verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)) {
    console.warn('Stripe signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // ── checkout.session.completed ────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session        = event.data.object;
    const email          = session.customer_email || session.metadata?.email || '';
    const stripeCustomer = session.customer || '';
    const stripeSub      = session.subscription || '';

    if (!email) {
      console.warn('checkout.session.completed: no email found in session', session.id);
      return res.status(200).json({ received: true });
    }

    // Check if a license already exists for this subscription (idempotency)
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/individual_licenses?stripe_subscription_id=eq.${encodeURIComponent(stripeSub)}&select=license_key,email&limit=1`,
      {
        headers: {
          'apikey':        SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const existing = await existingRes.json();
    let licenseKey;

    if (Array.isArray(existing) && existing.length > 0) {
      // Already processed — resend the email with the existing key
      licenseKey = existing[0].license_key;
      console.log('Duplicate webhook — resending license email for', email);
    } else {
      // Generate and store new license
      licenseKey = generateLicenseKey();
      const insertRes = await fetch(
        `${SUPABASE_URL}/rest/v1/individual_licenses`,
        {
          method: 'POST',
          headers: {
            'apikey':        SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal',
          },
          body: JSON.stringify({
            license_key:            licenseKey,
            email,
            plan:                   'pro',
            status:                 'active',
            stripe_customer_id:     stripeCustomer,
            stripe_subscription_id: stripeSub,
          }),
        }
      );
      if (!insertRes.ok) {
        const errText = await insertRes.text();
        console.error('Failed to insert license:', errText);
        return res.status(500).json({ error: 'Failed to store license' });
      }
    }

    // Send license key email via Resend
    const activateUrl = `${SITE_URL}/activate?key=${encodeURIComponent(licenseKey)}`;
    if (RESEND_API_KEY) {
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#12121f;border:1px solid #1a2a3a;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0a1a2a,#0d1a0d);padding:24px 28px;border-bottom:1px solid #1a2a3a;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#10b981;text-transform:uppercase;">SentraShield</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#f0fff4;">Your Pro license is ready ✓</h1>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">
        Thanks for subscribing to SentraShield Personal Pro! Click the button below to activate the extension in one click.
      </p>

      <!-- One-click activate button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${activateUrl}"
           style="display:inline-block;background:#2dd4bf;color:#080c14;font-weight:700;font-size:15px;
                  text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.3px;">
          Activate Pro Now →
        </a>
        <p style="margin:10px 0 0;color:#6b7280;font-size:11px;">Opens in Chrome and activates instantly</p>
      </div>

      <!-- Manual fallback key -->
      <div style="background:#0a0f1a;border:1px solid #1a3a2a;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 6px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
          Manual fallback — your license key
        </p>
        <code style="color:#34d399;font-family:monospace;font-size:13px;font-weight:700;word-break:break-all;">${licenseKey}</code>
        <p style="margin:8px 0 0;color:#6b7280;font-size:11px;line-height:1.6;">
          If the button above doesn't work: open the extension popup → click <strong style="color:#94a3b8;">"Get Pro →"</strong> → paste this key.
        </p>
      </div>

      <p style="color:#6b7280;font-size:12px;margin-top:20px;">
        Keep this email — you'll need the key if you reinstall the extension.<br>
        Manage your subscription: <a href="${SITE_URL}/personal" style="color:#34d399;">${SITE_URL}/personal</a>
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1a2a3a;background:#0c0c18;">
      <p style="margin:0;font-size:11px;color:#555;">
        SentraShield Personal · AI Data Loss Prevention · <a href="https://sentrashield.com" style="color:#555;">sentrashield.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    RESEND_FROM,
          to:      [email],
          subject: 'Your SentraShield Pro license key',
          html,
        }),
      }).catch(e => console.warn('License email failed:', e));
    }

    return res.status(200).json({ received: true });
  }

  // ── customer.subscription.deleted ────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await fetch(
      `${SUPABASE_URL}/rest/v1/individual_licenses?stripe_subscription_id=eq.${encodeURIComponent(sub.id)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey':        SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      }
    ).catch(e => console.warn('Failed to cancel license:', e));

    return res.status(200).json({ received: true });
  }

  // All other events — acknowledge and ignore
  return res.status(200).json({ received: true });
}
