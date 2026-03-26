# SentraShield Landing — Claude Code Ground Rules

## What This Project Is
B2B AI Data Loss Prevention SaaS — landing site and admin panel.
URL: sentrashield.com (Vercel)
Stack: Vite + React + TypeScript + Tailwind + shadcn/ui

---

## Repo Boundaries
SentraShield has THREE separate repos — keep them strictly separate:
- `sentrashield-landing` ← this repo (marketing site + all API functions + owner admin)
- `sentrashield-dashboard` ← customer dashboard (vanilla HTML/JS)
- `sentrashield-extension` ← Chrome MV3 extension

Never mix concerns across repos.

---

## Core Rules

### 1. API Functions (`api/`)
- All functions use ESM: `export default async function handler(req, res)`
- Auth pattern: `ADMIN_TOKEN` for admin endpoints, `CRON_SECRET` for cron jobs — always check at top of function, return 401 immediately if missing/wrong
- Supabase access via direct `fetch()` REST calls using `SUPABASE_SERVICE_KEY` — no SDK
- Resend for all transactional email via `RESEND_API_KEY`
- Never log secrets, tokens, or PII to console

### 2. Cron Jobs
- `cron-trial-check.js` — daily at 08:00 UTC via Vercel cron
- `cron-violation-alerts.js` — hourly via Vercel cron
- All crons are authenticated via `Authorization: Bearer {CRON_SECRET}` header (auto-injected by Vercel)
- Always include a skip guard to prevent duplicate processing within the same window

### 3. Business Logic (do not change without discussion)
- Trial period = 7 days from approval
- Subscription = 12 months from activation date
- Warning emails: trial at 3d + 1d; subscription at 30d + 7d
- Violation alerts: only fire for `critical` or `high` severity
- `active=false` disables the org — extension stops enforcing within 5 minutes
- No payment gateway — bank transfer only, owner manually activates via `/admin`

### 4. Owner Admin (`/admin` → `src/pages/OwnerAdmin.tsx`)
- Token-gated via `ADMIN_TOKEN`
- Actions: approve, reject, activate subscription, extend subscription
- Subscription plans: starter, professional, enterprise

### 5. TypeScript (same as CyberGuardian)
- No `any` — use proper types or `unknown`
- All props explicitly typed
- No `// @ts-ignore`

### 6. Git
- Conventional commit format: `type(scope): message`
- Always include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` footer
- Stage specific files only — never `git add .`

### 7. Security
- All secrets via Vercel environment variables — never in source code
- Validate `Content-Type` and request method on all API endpoints
- Rate limiting awareness — cron jobs have built-in skip guards
- Never expose org data across tenants (always filter by `org_id`)

### 8. SQL Migration (pending — must be run before testing)
```sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at        timestamptz,
  ADD COLUMN IF NOT EXISTS trial_warned_7d      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_warned_1d      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_status  text    NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS seats                int     NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS sub_warned_30d       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sub_warned_7d        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_alerted_at      timestamptz;
```

---

## Environment Variables Required
```
SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY
RESEND_API_KEY, RESEND_FROM
ADMIN_TOKEN
CRON_SECRET
```

## Key API Endpoints
| File | Method | Auth | Purpose |
|------|--------|------|---------|
| `admin-orgs.js` | GET | ADMIN_TOKEN | List all orgs |
| `admin-approve.js` | POST | ADMIN_TOKEN | Approve org, start trial, send magic link |
| `admin-reject.js` | POST | ADMIN_TOKEN | Reject org, send rejection email |
| `admin-activate.js` | POST | ADMIN_TOKEN | Activate or extend subscription |
| `notify-owner.js` | POST | none | New signup notification to owner |
| `cron-trial-check.js` | GET | CRON_SECRET | Daily trial/subscription expiry checks |
| `cron-violation-alerts.js` | GET | CRON_SECRET | Hourly violation alert emails |
