// api/admin-approve.js
// Approves a pending trial org:
//   1. Sets active=true, status='approved', approved_at=now()
//   2. Sends a magic login link to the customer's email
//
// Required env vars:
//   ADMIN_TOKEN            — secret token
//   SUPABASE_URL           — Supabase project URL
//   SUPABASE_SERVICE_KEY   — service role key (bypasses RLS)
//   SUPABASE_ANON_KEY      — anon key (for sending magic link)
//   RESEND_API_KEY         — for sending approval notification email

const BASE_DOMAIN = 'ai-dlp.sentrashield.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth check ────────────────────────────────────────────────
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { orgId } = req.body || {};
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

  const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
  const SUPABASE_ANON_KEY    = process.env.SUPABASE_ANON_KEY    || '';
  const RESEND_API_KEY       = process.env.RESEND_API_KEY       || '';
  const RESEND_FROM          = process.env.RESEND_FROM          || 'SentraShield <noreply@sentrashield.com>';

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
  }

  try {
    // ① Fetch org details
    const orgRes = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?id=eq.${encodeURIComponent(orgId)}&select=id,name,admin_email,slug,status`,
      {
        headers: {
          'apikey':        SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const orgs = await orgRes.json();
    const org  = Array.isArray(orgs) ? orgs[0] : null;
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    if (org.status === 'approved') return res.status(400).json({ error: 'Already approved' });

    // ② Mark as approved
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?id=eq.${encodeURIComponent(orgId)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey':        SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({
          active:         true,
          status:         'approved',
          approved_at:    new Date().toISOString(),
          // 7-day trial window — cron-trial-check.js enforces expiry daily
          trial_ends_at:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          trial_warned_7d: false,
          trial_warned_1d: false,
        }),
      }
    );
    if (!updateRes.ok) {
      const text = await updateRes.text();
      console.error('Update error:', text);
      return res.status(502).json({ error: 'Failed to update organization' });
    }

    // ③ Send magic link to customer via Supabase Admin Auth API
    const dashboardUrl = `https://${org.slug}.${BASE_DOMAIN}/dashboard`;
    const trialEndsAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const trialEndStr  = trialEndsAt.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
    if (SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY) {
      try {
        const magicLinkRes = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
          method: 'POST',
          headers: {
            'apikey':        SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            email:       org.admin_email,
            redirect_to: dashboardUrl,
          }),
        });
        if (!magicLinkRes.ok) {
          const errText = await magicLinkRes.text();
          console.warn(`Magic link failed (${magicLinkRes.status}) — org approved but no link sent:`, errText);
          // Non-fatal — org is still approved. Owner can resend manually.
        }
      } catch (e) {
        console.warn('Magic link request error — org approved but no link sent:', e);
        // Non-fatal — org is still approved. Owner can resend manually.
      }
    }

    // ④ Send branded approval email via Resend
    if (RESEND_API_KEY) {
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#12121f;border:1px solid #1a3a2a;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0a2a1a,#0d1a0d);padding:24px 28px;border-bottom:1px solid #1a3a2a;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#10b981;text-transform:uppercase;">SentraShield</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#f0fff4;">Your account has been approved ✓</h1>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">
        Hi ${org.name},<br><br>
        Great news — your SentraShield trial account has been approved!<br>
        We've sent a magic login link to this email address. Click it to access your dashboard.
      </p>
      <div style="background:#0a1a0a;border:1px solid #1a3a2a;border-radius:8px;padding:14px 16px;margin:20px 0;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Dashboard URL</p>
        <a href="${dashboardUrl}" style="color:#34d399;font-family:monospace;font-size:13px;word-break:break-all;">${dashboardUrl}</a>
      </div>
      <div style="background:#0a0f1a;border:1px solid #1a2a3a;border-radius:8px;padding:14px 16px;margin:20px 0;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">⏰ Trial Period</p>
        <p style="margin:0;color:#93c5fd;font-size:13px;">7 days free · Expires <strong>${trialEndStr}</strong></p>
      </div>
      <p style="color:#6b7280;font-size:12px;line-height:1.6;">
        If you don't see the magic link email, check your spam folder or visit your dashboard URL and request a new one.
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1a3a2a;background:#0c0c18;">
      <p style="margin:0;font-size:11px;color:#555;">
        SentraShield · AI Data Loss Prevention · <a href="https://sentrashield.com" style="color:#555;">sentrashield.com</a>
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
          to:      [org.admin_email],
          subject: `Your SentraShield account is approved — welcome, ${org.name}!`,
          html,
        }),
      }).catch(e => console.warn('Approval email failed:', e));
    }

    return res.status(200).json({ ok: true, message: `${org.name} approved and notified.` });

  } catch (err) {
    console.error('admin-approve error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
