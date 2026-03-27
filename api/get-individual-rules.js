// api/get-individual-rules.js
// Returns all enabled DLP rules for a valid Individual Pro license.
// Called by the Chrome extension after license validation to sync the full rule set.
//
// POST { licenseKey }
// Returns { rules: [...] } or { error }
//
// Required env vars:
//   SUPABASE_URL         — Supabase project URL
//   SUPABASE_SERVICE_KEY — service role key (bypasses RLS)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseKey } = req.body || {};
  if (!licenseKey || !licenseKey.startsWith('ss_ind_')) {
    return res.status(401).json({ error: 'Invalid license key' });
  }

  const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // ① Validate the license key
    const licRes = await fetch(
      `${SUPABASE_URL}/rest/v1/individual_licenses?license_key=eq.${encodeURIComponent(licenseKey)}&select=status&limit=1`,
      {
        headers: {
          'apikey':        SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const rows    = await licRes.json();
    const license = Array.isArray(rows) ? rows[0] : null;

    if (!license || license.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive license' });
    }

    // ② Fetch all enabled rules
    const rulesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/rules?enabled=eq.true&select=name,label,category,severity,pattern,flags&order=category.asc`,
      {
        headers: {
          'apikey':        SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const rules = await rulesRes.json();

    return res.status(200).json({ rules: Array.isArray(rules) ? rules : [] });

  } catch (err) {
    console.error('get-individual-rules error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
