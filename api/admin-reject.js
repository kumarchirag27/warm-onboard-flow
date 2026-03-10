// api/admin-reject.js
// Rejects a pending trial org:
//   1. Sets active=false, status='rejected', rejected_at=now(), rejection_reason
//   2. Optionally emails the customer with the reason
//
// Required env vars:
//   ADMIN_TOKEN            — secret token
//   SUPABASE_URL           — Supabase project URL
//   SUPABASE_SERVICE_KEY   — service role key
//   RESEND_API_KEY         — for rejection email

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

  const { orgId, reason = 'Domain could not be verified.' } = req.body || {};
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

  const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
  const RESEND_API_KEY       = process.env.RESEND_API_KEY       || '';
  const RESEND_FROM          = process.env.RESEND_FROM          || 'SentraShield <noreply@sentrashield.com>';

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
  }

  try {
    // ① Fetch org details
    const orgRes = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?id=eq.${encodeURIComponent(orgId)}&select=id,name,admin_email,status`,
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
    if (org.status === 'rejected') return res.status(400).json({ error: 'Already rejected' });

    // ② Mark as rejected
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
          active:            false,
          status:            'rejected',
          rejected_at:       new Date().toISOString(),
          rejection_reason:  reason,
        }),
      }
    );
    if (!updateRes.ok) {
      const text = await updateRes.text();
      console.error('Update error:', text);
      return res.status(502).json({ error: 'Failed to update organization' });
    }

    // ③ Send rejection email (optional but polite)
    if (RESEND_API_KEY) {
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#12121f;border:1px solid #3a1a1a;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1a0a0a,#1a0d0d);padding:24px 28px;border-bottom:1px solid #3a1a1a;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#f87171;text-transform:uppercase;">SentraShield</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#fff5f5;">Application Update</h1>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#cbd5e1;font-size:14px;line-height:1.7;">
        Hi ${org.name},<br><br>
        Thank you for your interest in SentraShield. Unfortunately, we were unable to approve your trial application at this time.
      </p>
      ${reason ? `
      <div style="background:#1a0a0a;border:1px solid #3a1a1a;border-radius:8px;padding:14px 16px;margin:20px 0;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Reason</p>
        <p style="margin:0;color:#fca5a5;font-size:13px;">${reason}</p>
      </div>` : ''}
      <p style="color:#6b7280;font-size:12px;line-height:1.6;">
        If you believe this was a mistake or would like to provide additional verification,
        please reply to this email or contact us at <a href="mailto:support@sentrashield.com" style="color:#818cf8;">support@sentrashield.com</a>.
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #3a1a1a;background:#0c0c18;">
      <p style="margin:0;font-size:11px;color:#555;">SentraShield · AI Data Loss Prevention</p>
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
          subject: 'Update on your SentraShield application',
          html,
        }),
      }).catch(e => console.warn('Rejection email failed:', e));
    }

    return res.status(200).json({ ok: true, message: `${org.name} rejected.` });

  } catch (err) {
    console.error('admin-reject error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
