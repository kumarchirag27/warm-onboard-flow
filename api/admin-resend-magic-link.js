// api/admin-resend-magic-link.js
// Resends a magic login link to an approved org's admin email.
// Called from the /admin panel when the customer's link has expired.
//
// Required env vars:
//   ADMIN_TOKEN            — owner secret token
//   SUPABASE_URL           — Supabase project URL
//   SUPABASE_SERVICE_KEY   — service role key

const BASE_DOMAIN = 'ai-dlp.sentrashield.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { orgId } = req.body || {};
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

  const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
  }

  try {
    // Fetch org details
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
    if (org.status !== 'approved') {
      return res.status(400).json({ error: 'Organization is not approved — approve it first' });
    }

    // Send magic link via Supabase Admin Auth API
    const dashboardUrl = `https://${org.slug}.${BASE_DOMAIN}/dashboard`;
    const magicRes = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        email:       org.admin_email,
        redirect_to: dashboardUrl,
      }),
    });

    if (!magicRes.ok) {
      const errText = await magicRes.text();
      console.error(`Magic link resend failed (${magicRes.status}):`, errText);
      return res.status(502).json({ error: 'Failed to send magic link' });
    }

    return res.status(200).json({ ok: true, message: `Magic link sent to ${org.admin_email}` });

  } catch (err) {
    console.error('admin-resend-magic-link error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
