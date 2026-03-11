// api/cron-violation-alerts.js
// Runs every hour. For each active org, checks for new critical or high
// severity violations since the last alert was sent. If found, emails the
// org admin a summary table with a link to the dashboard.
//
// Alert logic:
//   • Only triggers for 'critical' or 'high' severity violations.
//   • Tracks last alert time via organizations.last_alerted_at.
//   • Won't re-alert within 50 minutes even if cron fires early.
//   • Sends all violations in the window (critical + high + other) in the
//     email so the admin has full context, but only fires if critical/high exist.
//
// Vercel cron: "0 * * * *"   (every hour at :00)
//
// Required env vars:
//   SUPABASE_URL         — Supabase project URL
//   SUPABASE_SERVICE_KEY — service role key (bypasses RLS)
//   RESEND_API_KEY       — for sending emails
//   RESEND_FROM          — e.g. "SentraShield <noreply@sentrashield.com>"

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wvtyebsctlwbkmvvykfm.supabase.co';
const BASE_DOMAIN  = 'ai-dlp.sentrashield.com';
const WINDOW_MINS  = 60; // alert window in minutes

// ── HTML helpers ──────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function violationAlertHtml(org, violations, dashboardUrl) {
  const critical = violations.filter(v => v.severity === 'critical');
  const high     = violations.filter(v => v.severity === 'high');
  const other    = violations.filter(v => !['critical','high'].includes(v.severity));

  const hasCrit    = critical.length > 0;
  const accentColor = hasCrit ? '#f87171' : '#fcd34d';
  const headerBg    = hasCrit ? '#1a0505'  : '#1a1000';
  const borderColor = hasCrit ? '#3a1a1a'  : '#3a2800';
  const headerTitle = hasCrit
    ? `🔴 ${critical.length} critical violation${critical.length > 1 ? 's' : ''} detected`
    : `🟠 ${high.length} high-severity violation${high.length > 1 ? 's' : ''} detected`;

  const actionMap = {
    blocked:            '🔒 Blocked',
    masked:             '🔏 Masked',
    approval_requested: '📨 Pending',
    approved:           '✅ Approved',
    denied:             '🚫 Denied',
    ai_warned:          '⚠️ AI Warn',
  };

  // Table rows — max 15 shown; always show most severe first
  const ordered = [
    ...violations.filter(v => v.severity === 'critical'),
    ...violations.filter(v => v.severity === 'high'),
    ...violations.filter(v => !['critical','high'].includes(v.severity)),
  ].slice(0, 15);

  const rowsHtml = ordered.map(v => {
    const time     = new Date(v.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const findings = Array.isArray(v.findings) ? v.findings.join(', ') : (v.findings || '—');
    const action   = actionMap[v.action] || v.action || '—';
    const sevStyle = v.severity === 'critical'
      ? 'color:#f87171;font-weight:700'
      : v.severity === 'high'
      ? 'color:#fcd34d;font-weight:700'
      : 'color:#93c5fd';

    return `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #1a2a3a;color:#8ba3c8;font-size:11px;white-space:nowrap">${esc(time)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #1a2a3a;font-size:11px;color:#dde9f8;max-width:160px;overflow:hidden;text-overflow:ellipsis">${esc(v.user_email || 'Unknown')}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #1a2a3a;font-size:11px;color:#dde9f8">${esc(v.site || '—')}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #1a2a3a;font-size:11px;color:#dde9f8">${esc(findings)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #1a2a3a;font-size:11px;${sevStyle}">${esc(v.severity || '—')}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #1a2a3a;font-size:11px;color:#8ba3c8">${esc(action)}</td>
    </tr>`;
  }).join('');

  const moreHtml = violations.length > 15
    ? `<p style="color:#8ba3c8;font-size:12px;text-align:center;padding:8px 0;margin:0">
        + ${violations.length - 15} more — <a href="${esc(dashboardUrl)}" style="color:#2dd4bf">view all in dashboard</a>
       </p>`
    : '';

  // Severity summary pills
  const pills = [
    critical.length > 0 ? `<div style="flex:1;min-width:90px;background:#1a0505;border:1px solid #3a1a1a;border-radius:8px;padding:11px;text-align:center"><div style="font-size:20px;font-weight:700;color:#f87171">${critical.length}</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#f87171;margin-top:3px">Critical</div></div>` : '',
    high.length     > 0 ? `<div style="flex:1;min-width:90px;background:#1a1000;border:1px solid #3a2800;border-radius:8px;padding:11px;text-align:center"><div style="font-size:20px;font-weight:700;color:#fcd34d">${high.length}</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#fcd34d;margin-top:3px">High</div></div>` : '',
    other.length    > 0 ? `<div style="flex:1;min-width:90px;background:#0a1020;border:1px solid #1a2a3a;border-radius:8px;padding:11px;text-align:center"><div style="font-size:20px;font-weight:700;color:#93c5fd">${other.length}</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#93c5fd;margin-top:3px">Other</div></div>` : '',
    `<div style="flex:1;min-width:90px;background:#0a1020;border:1px solid #1a2a3a;border-radius:8px;padding:11px;text-align:center"><div style="font-size:20px;font-weight:700;color:#2dd4bf">${violations.length}</div><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#2dd4bf;margin-top:3px">Total</div></div>`,
  ].filter(Boolean).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
<div style="max-width:640px;margin:32px auto;background:#12121f;border:1px solid ${borderColor};border-radius:12px;overflow:hidden;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,${headerBg},#0a0d1a);padding:20px 28px;border-bottom:1px solid ${borderColor};">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:${accentColor};text-transform:uppercase;">SentraShield · DLP Alert</p>
    <h1 style="margin:8px 0 4px;font-size:18px;font-weight:700;color:#f0f4ff;">${esc(headerTitle)}</h1>
    <p style="margin:0;font-size:12px;color:#8ba3c8;">${esc(org.name)} · last ${WINDOW_MINS} minutes</p>
  </div>

  <!-- Severity pills -->
  <div style="padding:18px 28px 0;">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;">${pills}</div>

    <!-- Violations table -->
    <table width="100%" style="border-collapse:collapse;background:#0a1020;border:1px solid #1a2a3a;border-radius:8px;overflow:hidden;margin-bottom:4px;">
      <thead>
        <tr style="background:#0c1830">
          <th style="padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#48607f;font-weight:700;text-align:left;white-space:nowrap">Time</th>
          <th style="padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#48607f;font-weight:700;text-align:left">User</th>
          <th style="padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#48607f;font-weight:700;text-align:left">Site</th>
          <th style="padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#48607f;font-weight:700;text-align:left">Data Detected</th>
          <th style="padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#48607f;font-weight:700;text-align:left">Severity</th>
          <th style="padding:7px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#48607f;font-weight:700;text-align:left">Action</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    ${moreHtml}

    <!-- CTA -->
    <div style="margin-top:20px;padding-bottom:20px;">
      <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#2dd4bf;color:#060a10;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:700;font-size:13px;">
        Review in Dashboard →
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding:14px 28px;border-top:1px solid #1a2a3a;background:#0c0c18;">
    <p style="margin:0;font-size:11px;color:#555;">SentraShield · AI Data Loss Prevention ·
      You're receiving this because you're the admin for <strong style="color:#666">${esc(org.name)}</strong>.
    </p>
  </div>

</div></body></html>`;
}

// ── Email sender ──────────────────────────────────────────────────────────────
async function sendEmail(resendKey, from, to, subject, html) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
  } catch (e) {
    console.error('sendEmail failed:', e);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Auth: Vercel auto-injects CRON_SECRET for scheduled cron invocations
  const CRON_SECRET = process.env.CRON_SECRET || '';
  const authHeader  = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (CRON_SECRET && authHeader !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
  const RESEND_KEY  = process.env.RESEND_API_KEY       || '';
  const RESEND_FROM = process.env.RESEND_FROM          || 'SentraShield <noreply@sentrashield.com>';

  if (!SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const now         = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MINS * 60 * 1000);
  const results     = { checked: 0, alerted: 0, skipped: 0, noViolations: 0, errors: [] };

  // ── Fetch all active approved orgs ───────────────────────────────────────────
  const orgsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations` +
    `?select=id,name,admin_email,slug,last_alerted_at` +
    `&active=eq.true&status=eq.approved`,
    { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
  );

  if (!orgsRes.ok) {
    console.error('[cron-violation-alerts] Failed to fetch orgs:', await orgsRes.text());
    return res.status(502).json({ error: 'Failed to fetch organizations' });
  }

  const orgs = await orgsRes.json();
  results.checked = Array.isArray(orgs) ? orgs.length : 0;

  for (const org of (Array.isArray(orgs) ? orgs : [])) {
    try {
      // ── Skip if alerted too recently (within 50 min) ──────────────────────
      if (org.last_alerted_at) {
        const sinceLastAlert = now - new Date(org.last_alerted_at);
        if (sinceLastAlert < 50 * 60 * 1000) {
          results.skipped++;
          continue;
        }
      }

      // ── Determine the alert window start ─────────────────────────────────
      // Use whichever is more recent: last alert time or WINDOW_MINS ago
      const cutoff = org.last_alerted_at
        ? new Date(Math.max(new Date(org.last_alerted_at).getTime(), windowStart.getTime())).toISOString()
        : windowStart.toISOString();

      // ── Fetch violations in window ────────────────────────────────────────
      const vRes = await fetch(
        `${SUPABASE_URL}/rest/v1/violations` +
        `?select=id,timestamp,user_email,site,findings,severity,action,preview` +
        `&org_id=eq.${encodeURIComponent(org.id)}` +
        `&timestamp=gte.${encodeURIComponent(cutoff)}` +
        `&order=timestamp.desc&limit=50`,
        { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
      );

      if (!vRes.ok) {
        console.error(`[cron-violation-alerts] Failed to fetch violations for org ${org.id}`);
        results.errors.push(org.id);
        continue;
      }

      const violations = await vRes.json();

      // ── Only alert if critical or high violations exist ───────────────────
      const alertWorthy = (violations || []).filter(v => ['critical', 'high'].includes(v.severity));
      if (alertWorthy.length === 0) {
        results.noViolations++;
        continue;
      }

      // ── Build and send alert email ────────────────────────────────────────
      if (RESEND_KEY) {
        const dashboardUrl = `https://${org.slug}.${BASE_DOMAIN}/dashboard`;
        const critCount    = violations.filter(v => v.severity === 'critical').length;
        const highCount    = violations.filter(v => v.severity === 'high').length;

        const subject = critCount > 0
          ? `🔴 ${critCount} critical violation${critCount !== 1 ? 's' : ''} detected — ${org.name}`
          : `🟠 ${highCount} high-severity violation${highCount !== 1 ? 's' : ''} — ${org.name}`;

        await sendEmail(
          RESEND_KEY, RESEND_FROM, org.admin_email,
          subject,
          violationAlertHtml(org, violations, dashboardUrl)
        );
      }

      // ── Mark last alerted ─────────────────────────────────────────────────
      await fetch(
        `${SUPABASE_URL}/rest/v1/organizations?id=eq.${encodeURIComponent(org.id)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey':        SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal',
          },
          body: JSON.stringify({ last_alerted_at: now.toISOString() }),
        }
      );

      results.alerted++;
      console.log(`[cron-violation-alerts] Alerted org=${org.id} violations=${violations.length}`);

    } catch (err) {
      console.error(`[cron-violation-alerts] Error for org ${org.id}:`, err);
      results.errors.push(org.id);
    }
  }

  console.log('[cron-violation-alerts]', results);
  return res.status(200).json({ ok: true, ...results });
}
