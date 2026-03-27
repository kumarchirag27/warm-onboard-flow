// api/admin-sites.js
// Owner-only API for managing the monitored AI sites list.
// The extension syncs this list every 60 minutes (and on startup) so adding a
// new AI tool here propagates to all installed extensions without any code push.
//
// GET    /api/admin-sites         — list all sites (ordered by hostname)
// POST   /api/admin-sites         — add a new site
// PATCH  /api/admin-sites         — update a site (toggle enabled, edit label)
// DELETE /api/admin-sites         — remove a site (by id)
//
// Required env vars:
//   ADMIN_TOKEN          — owner secret token
//   SUPABASE_URL         — Supabase project URL
//   SUPABASE_SERVICE_KEY — service role key (bypasses RLS)

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

  const headers = {
    'apikey':        SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type':  'application/json'
  };

  try {
    // ── GET: list all sites ──────────────────────────────────────
    if (req.method === 'GET') {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/monitored_sites?select=*&order=hostname.asc`,
        { headers }
      );
      const sites = await r.json();
      return res.status(200).json({ sites: Array.isArray(sites) ? sites : [] });
    }

    // ── POST: add a site ─────────────────────────────────────────
    if (req.method === 'POST') {
      const { hostname, label } = req.body || {};
      if (!hostname) {
        return res.status(400).json({ error: 'Missing required field: hostname' });
      }

      // Basic hostname validation
      const hostnameRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      if (!hostnameRegex.test(hostname)) {
        return res.status(400).json({ error: `Invalid hostname: "${hostname}". Use format like "chat.example.com"` });
      }

      const r = await fetch(`${SUPABASE_URL}/rest/v1/monitored_sites`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ hostname: hostname.toLowerCase().trim(), label: label || hostname })
      });
      if (!r.ok) {
        const text = await r.text();
        if (text.includes('unique') || text.includes('duplicate')) {
          return res.status(409).json({ error: `Site "${hostname}" is already in the list` });
        }
        return res.status(502).json({ error: 'Failed to add site', detail: text });
      }
      const rows = await r.json();
      return res.status(201).json({ site: rows[0] || null });
    }

    // ── PATCH: update a site ─────────────────────────────────────
    if (req.method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing site id' });

      const allowed = ['hostname', 'label', 'enabled'];
      const update = Object.fromEntries(
        Object.entries(fields).filter(([k]) => allowed.includes(k))
      );

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/monitored_sites?id=eq.${encodeURIComponent(id)}`,
        { method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify(update) }
      );
      if (!r.ok) return res.status(502).json({ error: 'Failed to update site', detail: await r.text() });
      return res.status(200).json({ ok: true });
    }

    // ── DELETE: remove a site ─────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing site id' });

      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/monitored_sites?id=eq.${encodeURIComponent(id)}`,
        { method: 'DELETE', headers }
      );
      if (!r.ok) return res.status(502).json({ error: 'Failed to delete site', detail: await r.text() });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch(err) {
    console.error('admin-sites error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
