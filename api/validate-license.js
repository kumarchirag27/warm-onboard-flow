// api/validate-license.js
// Validates an Individual Pro license key.
// Called by the Chrome extension on startup and every 6 hours.
//
// POST { licenseKey }
// Returns { valid: true, plan: 'pro', email } or { valid: false }
//
// Required env vars:
//   SUPABASE_URL         — Supabase project URL
//   SUPABASE_SERVICE_KEY — service role key (bypasses RLS)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseKey } = req.body || {};
  if (!licenseKey || typeof licenseKey !== 'string') {
    return res.status(400).json({ valid: false, error: 'Missing licenseKey' });
  }

  // Basic format check — individual keys start with ss_ind_
  if (!licenseKey.startsWith('ss_ind_')) {
    return res.status(200).json({ valid: false });
  }

  const SUPABASE_URL         = process.env.SUPABASE_URL         || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const licRes = await fetch(
      `${SUPABASE_URL}/rest/v1/individual_licenses?license_key=eq.${encodeURIComponent(licenseKey)}&select=license_key,email,plan,status,expires_at`,
      {
        headers: {
          'apikey':        SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const rows = await licRes.json();
    const license = Array.isArray(rows) ? rows[0] : null;

    if (!license) {
      return res.status(200).json({ valid: false });
    }

    if (license.status !== 'active') {
      return res.status(200).json({ valid: false, reason: license.status });
    }

    // Check expiry if set (subscriptions don't expire unless cancelled)
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      // Mark as expired in DB (non-blocking)
      fetch(
        `${SUPABASE_URL}/rest/v1/individual_licenses?license_key=eq.${encodeURIComponent(licenseKey)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey':        SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal',
          },
          body: JSON.stringify({ status: 'expired' }),
        }
      ).catch(() => {});
      return res.status(200).json({ valid: false, reason: 'expired' });
    }

    return res.status(200).json({
      valid: true,
      plan:  license.plan,
      email: license.email,
    });

  } catch (err) {
    console.error('validate-license error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
