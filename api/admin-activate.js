// api/admin-activate.js
// POST /api/admin-activate
// Activates or extends a paid yearly subscription after a bank transfer is confirmed.
//
// Body: { orgId, plan, seats, action: 'activate' | 'extend' }
//   orgId   — UUID of the organization
//   plan    — 'starter' | 'professional' | 'enterprise'
//   seats   — number of licensed seats
//   action  — 'activate' starts a new 12-month term from today
//              'extend'   adds 12 months to the current end date (or today if already expired)
//
// Required env vars (Vercel dashboard):
//   ADMIN_TOKEN          — secret set in Vercel; must match Authorization: Bearer header
//   SUPABASE_URL         — Supabase project URL
//   SUPABASE_SERVICE_KEY — service role key (bypasses RLS)
//   RESEND_API_KEY       — for sending confirmation emails
//   RESEND_FROM          — e.g. "SentraShield <noreply@sentrashield.com>"
//   SITE_URL             — e.g. https://ai-dlp.sentrashield.com

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
const BASE_DOMAIN  = 'ai-dlp.sentrashield.com';

// ── HTML helpers ──────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function capitalize(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

function subscriptionConfirmHtml(org, plan, seats, endsAt, dashboardUrl, isExtend) {
  const endDateStr = endsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const title   = isExtend ? 'Subscription Extended' : 'Subscription Activated';
  const message = isExtend
    ? `Your SentraShield subscription has been extended and is valid until <strong style="color:#a5b4fc;">${esc(endDateStr)}</strong>.`
    : `Your SentraShield subscription is now active and valid until <strong style="color:#a5b4fc;">${esc(endDateStr)}</strong>.`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#12121f;border:1px solid #1e1a3a;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#0d0a1a,#0a0d1f);padding:24px 28px;border-bottom:1px solid #1e1a3a;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#6366f1;text-transform:uppercase;">SentraShield</p>
    <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#f0f4ff;">✅ ${esc(title)}</h1>
  </div>
  <div style="padding:24px 28px;">
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">
      Hi ${esc(org.name)},<br><br>
      ${message}<br><br>
      DLP enforcement is fully active on your employees' devices.
    </p>
    <div style="background:#0a0820;border:1px solid #1e1a3a;border-radius:8px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0 0 8px;color:#6366f1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Subscription Details</p>
      <p style="margin:3px 0;color:#e2e8f0;font-size:13px;">📦 Plan: <strong>${esc(capitalize(plan))}</strong></p>
      <p style="margin:3px 0;color:#e2e8f0;font-size:13px;">👥 Seats licensed: <strong>${esc(String(seats))}</strong></p>
      <p style="margin:3px 0;color:#e2e8f0;font-size:13px;">📅 Valid until: <strong>${esc(endDateStr)}</strong></p>
    </div>
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">
      You will receive renewal reminder emails 30 days and 7 days before your subscription expires.
    </p>
    <div style="margin-top:20px;">
      <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;">
        Go to Dashboard →
      </a>
    </div>
  </div>
  <div style="padding:16px 28px;border-top:1px solid #1e1a3a;background:#0c0c18;">
    <p style="margin:0;font-size:11px;color:#555;">SentraShield · AI Data Loss Prevention · <a href="https://sentrashield.com" style="color:#555;">sentrashield.com</a></p>
  </div>
</div></body></html>`;
}

// ── Resend email helper ───────────────────────────────────────────────────────
async function sendEmail(resendKey, from, to, subject, html) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
  } catch (e) {
    console.error('sendEmail failed:', e);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  const token       = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
  const RESEND_KEY  = process.env.RESEND_API_KEY       || '';
  const RESEND_FROM = process.env.RESEND_FROM          || 'SentraShield <noreply@sentrashield.com>';
  const SITE_URL    = process.env.SITE_URL             || 'https://ai-dlp.sentrashield.com';

  if (!SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  // Validate body
  const { orgId, plan, seats, action } = req.body || {};
  if (!orgId)                                    return res.status(400).json({ error: 'orgId is required' });
  if (!['activate', 'extend'].includes(action))  return res.status(400).json({ error: "action must be 'activate' or 'extend'" });

  // Fetch current org record
  const orgRes = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations` +
    `?id=eq.${encodeURIComponent(orgId)}` +
    `&select=id,name,admin_email,slug,plan,seats,subscription_ends_at,subscription_status`,
    {
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (!orgRes.ok) {
    console.error('Failed to fetch org:', await orgRes.text());
    return res.status(502).json({ error: 'Failed to fetch organization' });
  }

  const rows = await orgRes.json();
  const org  = rows[0];
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  // ── Calculate new subscription_ends_at ──────────────────────────────────────
  // 'activate' → always starts fresh from today
  // 'extend'   → adds 365 days to the later of (today, current end date)
  let base = new Date();
  if (action === 'extend' && org.subscription_ends_at) {
    const currentEnd = new Date(org.subscription_ends_at);
    if (currentEnd > base) base = currentEnd;
  }
  const newEndsAt = new Date(base.getTime() + 365 * 24 * 60 * 60 * 1000);

  const resolvedPlan  = plan  || org.plan  || 'professional';
  const resolvedSeats = seats ? Number(seats) : (org.seats || 25);

  // ── PATCH organization ───────────────────────────────────────────────────────
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations?id=eq.${encodeURIComponent(orgId)}`,
    {
      method: 'PATCH',
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        subscription_status:  'active',
        subscription_ends_at: newEndsAt.toISOString(),
        plan:                 resolvedPlan,
        seats:                resolvedSeats,
        active:               true,
        sub_warned_30d:       false,  // reset warning flags for the new term
        sub_warned_7d:        false,
      }),
    }
  );

  if (!patchRes.ok) {
    const errText = await patchRes.text();
    console.error('Supabase PATCH failed:', errText);
    return res.status(502).json({ error: 'Failed to update organization' });
  }

  // ── Send confirmation email ──────────────────────────────────────────────────
  if (RESEND_KEY) {
    const dashboardUrl = `https://${org.slug}.${BASE_DOMAIN}/dashboard`;
    const isExtend     = action === 'extend';
    const subject      = isExtend
      ? `Your SentraShield subscription has been extended — ${org.name}`
      : `Your SentraShield subscription is now active — ${org.name}`;

    await sendEmail(
      RESEND_KEY, RESEND_FROM, org.admin_email,
      subject,
      subscriptionConfirmHtml(org, resolvedPlan, resolvedSeats, newEndsAt, dashboardUrl, isExtend)
    );
  }

  console.log(`[admin-activate] ${action} org=${orgId} plan=${resolvedPlan} seats=${resolvedSeats} ends=${newEndsAt.toISOString()}`);

  return res.status(200).json({
    ok:                   true,
    action,
    plan:                 resolvedPlan,
    seats:                resolvedSeats,
    subscription_ends_at: newEndsAt.toISOString(),
  });
}
