// api/individual-api.js
// Unified Individual Pro API — consolidates validate-license + get-individual-rules
// into one serverless function to stay within Vercel Hobby 12-function limit.
//
// POST { action: 'validate', licenseKey }
//   → { valid: true, plan, email } or { valid: false }
//
// POST { action: 'rules', licenseKey }
//   → { rules: [...] }
//
// Required env vars:
//   SUPABASE_URL         — Supabase project URL
//   SUPABASE_SERVICE_KEY — service role key (bypasses RLS)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, licenseKey } = req.body || {};

  if (!licenseKey || typeof licenseKey !== 'string' || !licenseKey.startsWith('ss_ind_')) {
    return res.status(action === 'validate' ? 200 : 401).json(
      action === 'validate' ? { valid: false } : { error: 'Invalid license key' }
    );
  }

  const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabaseHeaders = {
    'apikey':        SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  };

  try {
    // ── action: validate ──────────────────────────────────────────
    if (action === 'validate') {
      const licRes = await fetch(
        `${SUPABASE_URL}/rest/v1/individual_licenses?license_key=eq.${encodeURIComponent(licenseKey)}&select=license_key,email,plan,status,expires_at`,
        { headers: supabaseHeaders }
      );
      const rows    = await licRes.json();
      const license = Array.isArray(rows) ? rows[0] : null;

      if (!license) return res.status(200).json({ valid: false });
      if (license.status !== 'active') return res.status(200).json({ valid: false, reason: license.status });

      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        fetch(
          `${SUPABASE_URL}/rest/v1/individual_licenses?license_key=eq.${encodeURIComponent(licenseKey)}`,
          {
            method: 'PATCH',
            headers: { ...supabaseHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ status: 'expired' }),
          }
        ).catch(() => {});
        return res.status(200).json({ valid: false, reason: 'expired' });
      }

      return res.status(200).json({ valid: true, plan: license.plan, email: license.email });
    }

    // ── action: rules ─────────────────────────────────────────────
    if (action === 'rules') {
      // Validate license first
      const licRes = await fetch(
        `${SUPABASE_URL}/rest/v1/individual_licenses?license_key=eq.${encodeURIComponent(licenseKey)}&select=status&limit=1`,
        { headers: supabaseHeaders }
      );
      const rows    = await licRes.json();
      const license = Array.isArray(rows) ? rows[0] : null;

      if (!license || license.status !== 'active') {
        return res.status(401).json({ error: 'Invalid or inactive license' });
      }

      const rulesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/rules?enabled=eq.true&select=name,label,category,severity,pattern,flags&order=category.asc`,
        { headers: supabaseHeaders }
      );
      const rules = await rulesRes.json();
      return res.status(200).json({ rules: Array.isArray(rules) ? rules : [] });
    }

    return res.status(400).json({ error: 'Invalid action. Use "validate" or "rules".' });

  } catch (err) {
    console.error('individual-api error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
