// api/admin-rules.js
// Owner-only API for managing global DLP detection rules.
// Rules are synced by the Chrome extension at startup and cached locally —
// no user data is ever sent to AI at runtime.
//
// GET    /api/admin-rules         — list all rules (ordered by created_at)
// POST   /api/admin-rules         — create a new rule
// PATCH  /api/admin-rules         — update a rule (toggle enabled, edit fields)
// DELETE /api/admin-rules         — delete a rule (by id)
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
    // ── GET: list all rules ──────────────────────────────────────
    if (req.method === 'GET') {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/rules?select=*&order=created_at.asc`,
        { headers }
      );
      const rules = await r.json();
      return res.status(200).json({ rules: Array.isArray(rules) ? rules : [] });
    }

    // ── POST: create a rule ──────────────────────────────────────
    if (req.method === 'POST') {
      const { name, label, category, severity, pattern, flags, description } = req.body || {};
      if (!name || !label || !category || !severity || !pattern) {
        return res.status(400).json({ error: 'Missing required fields: name, label, category, severity, pattern' });
      }

      // Validate regex
      try { new RegExp(pattern, flags || 'g'); } catch(e) {
        return res.status(400).json({ error: `Invalid regex pattern: ${e.message}` });
      }

      const r = await fetch(`${SUPABASE_URL}/rest/v1/rules`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ name, label, category, severity, pattern, flags: flags || 'g', description: description || null })
      });
      if (!r.ok) {
        const text = await r.text();
        if (text.includes('unique') || text.includes('duplicate')) {
          return res.status(409).json({ error: `Rule with name "${name}" already exists` });
        }
        return res.status(502).json({ error: 'Failed to create rule', detail: text });
      }
      const rows = await r.json();
      return res.status(201).json({ rule: rows[0] || null });
    }

    // ── PATCH: update a rule ─────────────────────────────────────
    if (req.method === 'PATCH') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing rule id' });

      // If pattern is being updated, validate it
      if (fields.pattern) {
        try { new RegExp(fields.pattern, fields.flags || 'g'); } catch(e) {
          return res.status(400).json({ error: `Invalid regex pattern: ${e.message}` });
        }
      }

      const allowed = ['name', 'label', 'category', 'severity', 'pattern', 'flags', 'description', 'enabled'];
      const update = Object.fromEntries(
        Object.entries(fields).filter(([k]) => allowed.includes(k))
      );

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/rules?id=eq.${encodeURIComponent(id)}`,
        { method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify(update) }
      );
      if (!r.ok) return res.status(502).json({ error: 'Failed to update rule', detail: await r.text() });
      return res.status(200).json({ ok: true });
    }

    // ── DELETE: delete a rule ─────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Missing rule id' });

      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/rules?id=eq.${encodeURIComponent(id)}`,
        { method: 'DELETE', headers }
      );
      if (!r.ok) return res.status(502).json({ error: 'Failed to delete rule', detail: await r.text() });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch(err) {
    console.error('admin-rules error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
