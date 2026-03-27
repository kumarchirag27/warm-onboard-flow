// api/cron-trial-check.js
// Runs once daily via Vercel cron (08:00 UTC).
// For every active approved org with a trial_ends_at date:
//   • daysLeft ≤ 0  → set active=false  + send "trial expired" email
//   • daysLeft ≤ 1  → send "1 day left"  warning  (once, guarded by trial_warned_1d)
//   • daysLeft ≤ 3  → send "3 days left" warning  (once, guarded by trial_warned_7d)
//
// Required env vars (Vercel dashboard):
//   CRON_SECRET          — auto-injected by Vercel; used to authenticate the cron call
//   SUPABASE_SERVICE_KEY — service role key (bypasses RLS)
//   RESEND_API_KEY       — for sending emails
//   RESEND_FROM          — e.g. "SentraShield <noreply@sentrashield.com>"
//   SITE_URL             — e.g. https://ai-dlp.sentrashield.com

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
const BASE_DOMAIN  = 'ai-dlp.sentrashield.com';

// ── HTML helpers ──────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function trialExpiredHtml(org, dashboardUrl, upgradeUrl) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#12121f;border:1px solid #3a1a1a;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1a0505,#1a0a0a);padding:24px 28px;border-bottom:1px solid #3a1a1a;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#f87171;text-transform:uppercase;">SentraShield</p>
    <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#fff5f5;">Your trial has ended</h1>
  </div>
  <div style="padding:24px 28px;">
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">
      Hi ${esc(org.name)},<br><br>
      Your 7-day SentraShield trial has ended and DLP enforcement has been <strong style="color:#f87171;">paused</strong> on your employees' devices.
    </p>
    <div style="background:#1a0505;border:1px solid #3a1a1a;border-radius:8px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#f87171;font-size:13px;font-weight:700;">⚠️ Your data is no longer protected</p>
      <p style="margin:0;color:#fca5a5;font-size:12px;line-height:1.6;">Sensitive data pasted into ChatGPT, Claude, Gemini and other AI tools is no longer being scanned or blocked.</p>
    </div>
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">Upgrade to a paid plan to restore protection immediately.</p>
    <div style="margin-top:20px;">
      <a href="${esc(upgradeUrl)}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;margin-right:10px;">
        Upgrade Now →
      </a>
      <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#1a1a30;border:1px solid #3a3a55;color:#a5b4fc;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:13px;">
        View Dashboard
      </a>
    </div>
  </div>
  <div style="padding:16px 28px;border-top:1px solid #3a1a1a;background:#0c0c18;">
    <p style="margin:0;font-size:11px;color:#555;">SentraShield · AI Data Loss Prevention · <a href="https://sentrashield.com" style="color:#555;">sentrashield.com</a></p>
  </div>
</div></body></html>`;
}

function trialWarningHtml(org, daysLeft, dashboardUrl, upgradeUrl) {
  const urgent   = daysLeft <= 1;
  const accentColor = urgent ? '#f97316' : '#f59e0b';
  const bgColor     = urgent ? '#1a0a00' : '#1a1000';
  const borderColor = urgent ? '#3a1a00' : '#3a2800';
  const dayLabel    = daysLeft <= 1 ? 'less than 24 hours' : `${daysLeft} days`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#12121f;border:1px solid ${borderColor};border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,${bgColor},#0d1a0d);padding:24px 28px;border-bottom:1px solid ${borderColor};">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:${accentColor};text-transform:uppercase;">SentraShield</p>
    <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#fffaf0;">${urgent ? '⚡ ' : '⏰ '}Trial ending in ${dayLabel}</h1>
  </div>
  <div style="padding:24px 28px;">
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">
      Hi ${esc(org.name)},<br><br>
      Your SentraShield 7-day trial expires in <strong style="color:${accentColor};">${dayLabel}</strong>.
      After that, DLP enforcement will pause and your team's AI tool usage will be unprotected.
    </p>
    <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0 0 8px;color:${accentColor};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">What you'll lose</p>
      <p style="margin:2px 0;color:#e2e8f0;font-size:12px;">🔒 Real-time blocking of sensitive data on ChatGPT, Claude, Gemini</p>
      <p style="margin:2px 0;color:#e2e8f0;font-size:12px;">🔏 Automatic PII, credential and IP masking</p>
      <p style="margin:2px 0;color:#e2e8f0;font-size:12px;">📊 Violation logs and employee activity dashboard</p>
      <p style="margin:2px 0;color:#e2e8f0;font-size:12px;">📨 Admin approval workflow for sensitive pastes</p>
    </div>
    <p style="color:#cbd5e1;font-size:13px;line-height:1.7;">Upgrade now to keep your team protected without any interruption.</p>
    <div style="margin-top:20px;">
      <a href="${esc(upgradeUrl)}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;margin-right:10px;">
        Upgrade Now →
      </a>
      <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#1a1a30;border:1px solid #3a3a55;color:#a5b4fc;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:13px;">
        View Dashboard
      </a>
    </div>
  </div>
  <div style="padding:16px 28px;border-top:1px solid ${borderColor};background:#0c0c18;">
    <p style="margin:0;font-size:11px;color:#555;">SentraShield · AI Data Loss Prevention · <a href="https://sentrashield.com" style="color:#555;">sentrashield.com</a></p>
  </div>
</div></body></html>`;
}

// ── Subscription email helpers ────────────────────────────────────────────────
function subscriptionExpiredHtml(org, dashboardUrl, renewUrl) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#12121f;border:1px solid #3a1a1a;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1a0505,#1a0a0a);padding:24px 28px;border-bottom:1px solid #3a1a1a;">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#f87171;text-transform:uppercase;">SentraShield</p>
    <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#fff5f5;">Your subscription has expired</h1>
  </div>
  <div style="padding:24px 28px;">
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">
      Hi ${esc(org.name)},<br><br>
      Your SentraShield subscription has expired and DLP enforcement has been <strong style="color:#f87171;">paused</strong> on your employees' devices.
    </p>
    <div style="background:#1a0505;border:1px solid #3a1a1a;border-radius:8px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#f87171;font-size:13px;font-weight:700;">⚠️ Your data is no longer protected</p>
      <p style="margin:0;color:#fca5a5;font-size:12px;line-height:1.6;">Sensitive data pasted into ChatGPT, Claude, Gemini and other AI tools is no longer being scanned or blocked.</p>
    </div>
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">Contact us to renew your subscription and restore protection immediately.</p>
    <div style="margin-top:20px;">
      <a href="${esc(renewUrl)}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;margin-right:10px;">
        Renew Now →
      </a>
      <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#1a1a30;border:1px solid #3a3a55;color:#a5b4fc;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:13px;">
        View Dashboard
      </a>
    </div>
  </div>
  <div style="padding:16px 28px;border-top:1px solid #3a1a1a;background:#0c0c18;">
    <p style="margin:0;font-size:11px;color:#555;">SentraShield · AI Data Loss Prevention · <a href="https://sentrashield.com" style="color:#555;">sentrashield.com</a></p>
  </div>
</div></body></html>`;
}

function subscriptionWarningHtml(org, daysLeft, dashboardUrl, renewUrl) {
  const urgent      = daysLeft <= 7;
  const accentColor = urgent ? '#f97316' : '#6366f1';
  const bgColor     = urgent ? '#1a0a00' : '#0d0a1a';
  const borderColor = urgent ? '#3a1a00' : '#1e1a3a';
  const dayLabel    = daysLeft <= 1 ? 'less than 24 hours' : `${daysLeft} days`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#12121f;border:1px solid ${borderColor};border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,${bgColor},#0a0d1a);padding:24px 28px;border-bottom:1px solid ${borderColor};">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:${accentColor};text-transform:uppercase;">SentraShield</p>
    <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#fffaf0;">${urgent ? '⚡ ' : '⏰ '}Subscription expires in ${dayLabel}</h1>
  </div>
  <div style="padding:24px 28px;">
    <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">
      Hi ${esc(org.name)},<br><br>
      Your SentraShield subscription expires in <strong style="color:${accentColor};">${dayLabel}</strong>.
      After that, DLP enforcement will pause and your team's AI tool usage will be unprotected.
    </p>
    <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0 0 8px;color:${accentColor};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Action required</p>
      <p style="margin:0;color:#e2e8f0;font-size:12px;line-height:1.6;">Reply to this email or contact your account manager to arrange renewal via bank transfer before your subscription lapses.</p>
    </div>
    <p style="color:#cbd5e1;font-size:13px;line-height:1.7;">Renew now to keep your team protected without any interruption.</p>
    <div style="margin-top:20px;">
      <a href="${esc(renewUrl)}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;margin-right:10px;">
        Renew Now →
      </a>
      <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#1a1a30;border:1px solid #3a3a55;color:#a5b4fc;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:13px;">
        View Dashboard
      </a>
    </div>
  </div>
  <div style="padding:16px 28px;border-top:1px solid ${borderColor};background:#0c0c18;">
    <p style="margin:0;font-size:11px;color:#555;">SentraShield · AI Data Loss Prevention · <a href="https://sentrashield.com" style="color:#555;">sentrashield.com</a></p>
  </div>
</div></body></html>`;
}

// ── Supabase PATCH helper ─────────────────────────────────────────────────────
async function patchOrg(serviceKey, orgId, fields) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/organizations?id=eq.${encodeURIComponent(orgId)}`, {
    method: 'PATCH',
    headers: {
      'apikey':        serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(fields),
  });
  return res.ok;
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
  // Only allow GET (Vercel cron) or POST (manual trigger with secret)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate — Vercel injects Authorization: Bearer {CRON_SECRET} automatically.
  // Secret MUST be configured; requests are rejected if the env var is absent.
  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET) return res.status(500).json({ error: 'CRON_SECRET not configured' });
  const authHeader  = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (authHeader !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
  const RESEND_KEY  = process.env.RESEND_API_KEY       || '';
  const RESEND_FROM = process.env.RESEND_FROM          || 'SentraShield <noreply@sentrashield.com>';
  const SITE_URL    = process.env.SITE_URL             || 'https://ai-dlp.sentrashield.com';

  if (!SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const now = new Date();
  const results = { checked: 0, expired: 0, warned1d: 0, warned7d: 0, errors: [] };

  // Fetch all active approved orgs that have a trial end date
  const orgsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations` +
    `?select=id,name,admin_email,slug,trial_ends_at,trial_warned_7d,trial_warned_1d` +
    `&active=eq.true&status=eq.approved&trial_ends_at=not.is.null`,
    {
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (!orgsRes.ok) {
    console.error('Failed to fetch orgs:', await orgsRes.text());
    return res.status(502).json({ error: 'Failed to fetch organizations' });
  }

  const orgs = await orgsRes.json();
  if (!Array.isArray(orgs)) return res.status(500).json({ error: 'Unexpected response from Supabase' });

  results.checked = orgs.length;

  for (const org of orgs) {
    try {
      const trialEnd  = new Date(org.trial_ends_at);
      const msLeft    = trialEnd - now;
      const daysLeft  = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      const dashboardUrl = `https://${org.slug}.${BASE_DOMAIN}/dashboard`;
      const upgradeUrl   = `${SITE_URL}/#pricing`;

      // ── EXPIRED ────────────────────────────────────────────────
      if (daysLeft <= 0) {
        await patchOrg(SERVICE_KEY, org.id, { active: false });

        if (RESEND_KEY) {
          await sendEmail(
            RESEND_KEY, RESEND_FROM, org.admin_email,
            `Your SentraShield trial has ended — ${org.name}`,
            trialExpiredHtml(org, dashboardUrl, upgradeUrl)
          );
        }
        results.expired++;
        continue;
      }

      // ── 1-DAY WARNING ──────────────────────────────────────────
      if (daysLeft <= 1 && !org.trial_warned_1d) {
        if (RESEND_KEY) {
          await sendEmail(
            RESEND_KEY, RESEND_FROM, org.admin_email,
            `⚡ Your SentraShield trial ends tomorrow — ${org.name}`,
            trialWarningHtml(org, daysLeft, dashboardUrl, upgradeUrl)
          );
        }
        await patchOrg(SERVICE_KEY, org.id, { trial_warned_1d: true });
        results.warned1d++;
        continue;
      }

      // ── 3-DAY WARNING ──────────────────────────────────────────
      if (daysLeft <= 3 && !org.trial_warned_7d) {
        if (RESEND_KEY) {
          await sendEmail(
            RESEND_KEY, RESEND_FROM, org.admin_email,
            `⏰ ${daysLeft} days left on your SentraShield trial — ${org.name}`,
            trialWarningHtml(org, daysLeft, dashboardUrl, upgradeUrl)
          );
        }
        await patchOrg(SERVICE_KEY, org.id, { trial_warned_7d: true });
        results.warned7d++;
      }

    } catch (err) {
      console.error(`Trial check failed for org ${org.id}:`, err);
      results.errors.push(org.id);
    }
  }

  // ── SUBSCRIPTION EXPIRY CHECK ──────────────────────────────────────────────
  // Separate from trial: handles paid orgs with subscription_status='active'
  // • daysLeft ≤ 0  → set active=false + subscription_status='expired' + send expiry email
  // • daysLeft ≤ 7  → send "7 days" warning (once, guarded by sub_warned_7d)
  // • daysLeft ≤ 30 → send "30 days" warning (once, guarded by sub_warned_30d)
  const subResults = { subChecked: 0, subExpired: 0, subWarned7d: 0, subWarned30d: 0 };

  const subsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations` +
    `?select=id,name,admin_email,slug,subscription_ends_at,sub_warned_30d,sub_warned_7d` +
    `&active=eq.true&status=eq.approved&subscription_status=eq.active&subscription_ends_at=not.is.null`,
    {
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (!subsRes.ok) {
    console.error('Failed to fetch subscription orgs:', await subsRes.text());
  } else {
    const subs = await subsRes.json();
    subResults.subChecked = Array.isArray(subs) ? subs.length : 0;

    for (const org of (Array.isArray(subs) ? subs : [])) {
      try {
        const subEnd   = new Date(org.subscription_ends_at);
        const msLeft   = subEnd - now;
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

        const dashboardUrl = `https://${org.slug}.${BASE_DOMAIN}/dashboard`;
        const renewUrl     = `${SITE_URL}/#pricing`;

        // ── EXPIRED ──────────────────────────────────────────────
        if (daysLeft <= 0) {
          await patchOrg(SERVICE_KEY, org.id, { active: false, subscription_status: 'expired' });

          if (RESEND_KEY) {
            await sendEmail(
              RESEND_KEY, RESEND_FROM, org.admin_email,
              `Your SentraShield subscription has expired — ${org.name}`,
              subscriptionExpiredHtml(org, dashboardUrl, renewUrl)
            );
          }
          subResults.subExpired++;
          continue;
        }

        // ── 7-DAY WARNING ─────────────────────────────────────────
        if (daysLeft <= 7 && !org.sub_warned_7d) {
          if (RESEND_KEY) {
            await sendEmail(
              RESEND_KEY, RESEND_FROM, org.admin_email,
              `⚡ Your SentraShield subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — ${org.name}`,
              subscriptionWarningHtml(org, daysLeft, dashboardUrl, renewUrl)
            );
          }
          // Mark both 7d and 30d to avoid sending the 30d warning after the 7d
          await patchOrg(SERVICE_KEY, org.id, { sub_warned_7d: true, sub_warned_30d: true });
          subResults.subWarned7d++;
          continue;
        }

        // ── 30-DAY WARNING ────────────────────────────────────────
        if (daysLeft <= 30 && !org.sub_warned_30d) {
          if (RESEND_KEY) {
            await sendEmail(
              RESEND_KEY, RESEND_FROM, org.admin_email,
              `⏰ ${daysLeft} days until your SentraShield subscription expires — ${org.name}`,
              subscriptionWarningHtml(org, daysLeft, dashboardUrl, renewUrl)
            );
          }
          await patchOrg(SERVICE_KEY, org.id, { sub_warned_30d: true });
          subResults.subWarned30d++;
        }

      } catch (err) {
        console.error(`Subscription check failed for org ${org.id}:`, err);
        results.errors.push(org.id);
      }
    }
  }

  console.log('[cron-trial-check]', { ...results, ...subResults });
  return res.status(200).json({ ok: true, ...results, ...subResults });
}
