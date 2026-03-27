// api/admin-orgs.js
// Returns all organizations for the owner admin panel.
// Requires Authorization: Bearer {ADMIN_TOKEN} header.
//
// Required env vars:
//   ADMIN_TOKEN            — secret token set in Vercel
//   SUPABASE_URL           — Supabase project URL
//   SUPABASE_SERVICE_KEY   — Supabase service role key (bypasses RLS)
//
// ⚠️  NEVER expose SUPABASE_SERVICE_KEY to the browser.
//     This route is server-side only.

const BASE_DOMAIN = 'ai-dlp.sentrashield.com';

export default async function handler(req, res) {
  // ── Auth check ────────────────────────────────────────────────
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
  }

  // ── POST: resend magic link ────────────────────────────────────
  if (req.method === 'POST') {
    const { orgId } = req.body || {};
    if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

    try {
      const orgRes = await fetch(
        `${SUPABASE_URL}/rest/v1/organizations?id=eq.${encodeURIComponent(orgId)}&select=id,name,admin_email,slug,status`,
        { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
      );
      const orgs = await orgRes.json();
      const org  = Array.isArray(orgs) ? orgs[0] : null;
      if (!org) return res.status(404).json({ error: 'Organization not found' });
      if (org.status !== 'approved') return res.status(400).json({ error: 'Organization is not approved' });

      const magicRes = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: org.admin_email, redirect_to: `https://${org.slug}.${BASE_DOMAIN}/dashboard` }),
      });

      if (!magicRes.ok) {
        const errText = await magicRes.text();
        console.error('Magic link resend failed:', errText);
        return res.status(502).json({ error: 'Failed to send magic link' });
      }
      return res.status(200).json({ ok: true, message: `Magic link sent to ${org.admin_email}` });
    } catch (err) {
      console.error('admin-orgs POST error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Fetch all orgs, ordered by newest first
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?select=id,name,full_name,job_title,admin_email,domain,slug,plan,active,status,policy,seats_used,seats,created_at,trial_ends_at,subscription_status,subscription_ends_at&order=created_at.desc`,
      {
        headers: {
          'apikey':        SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type':  'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Supabase error:', text);
      return res.status(502).json({ error: 'Database query failed' });
    }

    const orgs = await response.json();

    // Compute quick stats
    const stats = {
      total:    orgs.length,
      pending:  orgs.filter(o => o.status === 'pending').length,
      approved: orgs.filter(o => o.status === 'approved').length,
      rejected: orgs.filter(o => o.status === 'rejected').length,
    };

    return res.status(200).json({ orgs, stats });
  } catch (err) {
    console.error('admin-orgs error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
