// api/notify-owner.js
// Fires when a new trial signup is submitted.
// Sends an email to the product owner with signup details + a direct approve link.
//
// Required env vars (Vercel dashboard):
//   RESEND_API_KEY     — your Resend API key
//   OWNER_EMAIL        — the email address to notify (e.g. admin@sentrashield.com)
//   ADMIN_TOKEN        — secret token for the /admin panel
//   SITE_URL           — e.g. https://sentrashield.com

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    orgName, fullName, email, domain, slug,
    domainMismatch = false, isPersonalEmail = false,
  } = req.body || {};

  if (!orgName || !email || !domain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const OWNER_EMAIL    = process.env.OWNER_EMAIL    || 'admin@sentrashield.com';
  const ADMIN_TOKEN    = process.env.ADMIN_TOKEN    || '';
  const SITE_URL       = process.env.SITE_URL       || 'https://sentrashield.com';

  if (!RESEND_API_KEY) {
    // Missing key is non-fatal — just log and return OK so signup still succeeds
    console.warn('notify-owner: RESEND_API_KEY not set, skipping owner notification');
    return res.status(200).json({ ok: true, skipped: true });
  }

  const adminUrl = `${SITE_URL}/admin?token=${encodeURIComponent(ADMIN_TOKEN)}`;

  // Risk flags for the email
  const flags = [];
  if (domainMismatch)   flags.push('⚠️ Email domain does not match company domain');
  if (isPersonalEmail)  flags.push('⚠️ Used a personal email (Gmail/Outlook etc.)');

  const flagHtml = flags.length
    ? `<div style="background:#7c3aed1a;border:1px solid #7c3aed44;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
         <p style="margin:0 0 4px;font-weight:700;color:#c4b5fd;font-size:13px;">🚩 Review Flags</p>
         ${flags.map(f => `<p style="margin:2px 0;color:#ddd6fe;font-size:12px;">${esc(f)}</p>`).join('')}
       </div>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#12121f;border:1px solid #2a2a40;border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a0a2e,#0d1a2e);padding:24px 28px;border-bottom:1px solid #2a2a40;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#6366f1;text-transform:uppercase;">SentraShield Owner Alert</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#f0f0ff;">New Trial Signup 🎉</h1>
    </div>

    <div style="padding:24px 28px;">

      ${flagHtml}

      <!-- Details table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:8px 0;color:#888;font-size:12px;font-weight:600;width:120px;">Company</td>
          <td style="padding:8px 0;color:#f0f0ff;font-size:13px;font-weight:700;">${esc(orgName)}</td>
        </tr>
        <tr style="border-top:1px solid #2a2a40;">
          <td style="padding:8px 0;color:#888;font-size:12px;font-weight:600;">Contact</td>
          <td style="padding:8px 0;color:#f0f0ff;font-size:13px;">${esc(fullName)} &lt;${esc(email)}&gt;</td>
        </tr>
        <tr style="border-top:1px solid #2a2a40;">
          <td style="padding:8px 0;color:#888;font-size:12px;font-weight:600;">Domain</td>
          <td style="padding:8px 0;color:#f0f0ff;font-size:13px;font-family:monospace;">${esc(domain)}</td>
        </tr>
        <tr style="border-top:1px solid #2a2a40;">
          <td style="padding:8px 0;color:#888;font-size:12px;font-weight:600;">Slug</td>
          <td style="padding:8px 0;color:#818cf8;font-size:12px;font-family:monospace;">${esc(slug)}.ai-dlp.sentrashield.com</td>
        </tr>
      </table>

      <!-- CTA buttons -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="${esc(adminUrl)}"
           style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;
                  padding:11px 22px;border-radius:8px;font-weight:700;font-size:13px;">
          Open Admin Panel →
        </a>
        <a href="https://supabase.com/dashboard/project/wvtyebsctlwbkmvvykfm/editor"
           style="display:inline-block;background:#1a1a30;border:1px solid #3a3a55;color:#a5b4fc;
                  text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:13px;">
          View in Supabase
        </a>
      </div>
    </div>

    <div style="padding:16px 28px;border-top:1px solid #2a2a40;background:#0c0c18;">
      <p style="margin:0;font-size:11px;color:#555;">
        Sent automatically by SentraShield · Do not reply to this email
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'SentraShield <noreply@sentrashield.com>',
        to:      [OWNER_EMAIL],
        subject: `New trial signup: ${orgName} (${domain})`,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Resend error:', text);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('notify-owner error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
