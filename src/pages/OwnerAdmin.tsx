import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, RefreshCw,
  Building2, Briefcase, Mail, Globe, Users, ShieldAlert,
  AlertTriangle, Lock, LogOut, ExternalLink, CreditCard, Calendar,
  ShieldCheck, Plus, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
interface Org {
  id: string;
  name: string;
  full_name: string | null;
  job_title: string | null;
  admin_email: string;
  domain: string;
  slug: string;
  plan: string;
  active: boolean;
  status: 'pending' | 'approved' | 'rejected' | null;
  policy: string;
  seats_used: number | null;
  seats: number | null;
  created_at: string;
  trial_ends_at: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
}
interface Stats { total: number; pending: number; approved: number; rejected: number; }

type Filter = 'all' | 'pending' | 'approved' | 'rejected';
type MainTab = 'orgs' | 'rules' | 'sites';

interface Rule {
  id: string;
  name: string;
  label: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern: string;
  flags: string;
  description: string | null;
  enabled: boolean;
  created_at: string;
}

interface MonitoredSite {
  id: string;
  hostname: string;
  label: string;
  enabled: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const SESSION_KEY = 'sentra_admin_token';

/**
 * Read the admin token synchronously — used as a lazy useState initializer
 * so the component starts in the correct auth state with zero flash.
 *
 * Priority:
 *   1. #token=…  (hash fragment — new secure format, never logged by server)
 *   2. ?token=…  (query param  — backward compat for old email links)
 *   3. sessionStorage (already authenticated this browser session)
 */
function readToken(): string {
  const hashToken = new URLSearchParams(window.location.hash.slice(1)).get('token');
  if (hashToken) { sessionStorage.setItem(SESSION_KEY, hashToken); return hashToken; }

  const queryToken = new URLSearchParams(window.location.search).get('token');
  if (queryToken) { sessionStorage.setItem(SESSION_KEY, queryToken); return queryToken; }

  return sessionStorage.getItem(SESSION_KEY) ?? '';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: Org['status'] }) {
  const map = {
    pending:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/25',  icon: <Clock className="h-3 w-3" />,       label: 'Pending'  },
    approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25', icon: <CheckCircle className="h-3 w-3" />, label: 'Approved' },
    rejected: { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/25',    icon: <XCircle className="h-3 w-3" />,     label: 'Rejected' },
  };
  const s = status ? map[status] : map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {s.label}
    </span>
  );
}

function SubscriptionBadge({ status, endsAt }: { status: string | null; endsAt: string | null }) {
  if (!status || status === 'trial') return null;

  const daysLeft = endsAt
    ? Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (status === 'active') {
    const warn = daysLeft !== null && daysLeft <= 30;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
        warn
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
      }`}>
        <CreditCard className="h-3 w-3" />
        {warn ? `${daysLeft}d left` : 'Active Sub'}
      </span>
    );
  }

  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-red-500/10 text-red-400 border-red-500/25">
        <XCircle className="h-3 w-3" /> Sub Expired
      </span>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
const OwnerAdmin = () => {
  const [adminToken, setAdminToken]   = useState<string>(readToken);           // lazy — runs once
  const [authed, setAuthed]           = useState<boolean>(() => !!readToken()); // lazy — runs once
  const [tokenInput, setTokenInput]   = useState('');
  const [tokenError, setTokenError]   = useState('');

  const [mainTab, setMainTab]         = useState<MainTab>('orgs');

  const [orgs, setOrgs]               = useState<Org[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [filter, setFilter]           = useState<Filter>('pending');
  const [loading, setLoading]         = useState(false);
  const [actionId, setActionId]       = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Org | null>(null);
  const [rejectReason, setRejectReason] = useState('Domain could not be verified.');

  // ── Subscription activation state ───────────────────────────────
  const [activateTarget, setActivateTarget] = useState<Org | null>(null);
  const [activatePlan,   setActivatePlan]   = useState('professional');
  const [activateSeats,  setActivateSeats]  = useState('25');
  const [activateAction, setActivateAction] = useState<'activate' | 'extend'>('activate');

  // ── Rules state ─────────────────────────────────────────────────
  const [rules, setRules]             = useState<Rule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule]         = useState({ name: '', label: '', category: 'pii', severity: 'high', pattern: '', flags: 'g', description: '' });
  const [ruleActionId, setRuleActionId] = useState<string | null>(null);

  // ── Sites state ─────────────────────────────────────────────────
  const [sites, setSites]               = useState<MonitoredSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [showAddSite, setShowAddSite]   = useState(false);
  const [newSiteHostname, setNewSiteHostname] = useState('');
  const [newSiteLabel, setNewSiteLabel]       = useState('');
  const [siteActionId, setSiteActionId]       = useState<string | null>(null);

  // ── Clean up token from URL bar after it has been read into state ──
  //    readToken() already saved the token to sessionStorage synchronously,
  //    so we just need to strip it from the address bar on mount.
  useEffect(() => {
    const hasTokenInUrl =
      window.location.hash.includes('token=') ||
      window.location.search.includes('token=');
    if (hasTokenInUrl) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Show toast ───────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch orgs ───────────────────────────────────────────────
  const fetchOrgs = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-orgs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(SESSION_KEY);
        setAuthed(false);
        setTokenError('Invalid token. Please re-enter.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setOrgs(data.orgs || []);
      setStats(data.stats || null);
    } catch {
      showToast('Failed to load organizations', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && adminToken) fetchOrgs(adminToken);
  }, [authed, adminToken, fetchOrgs]);

  // ── Fetch rules ───────────────────────────────────────────────
  const fetchRules = useCallback(async (token: string) => {
    setRulesLoading(true);
    try {
      const res = await fetch('/api/admin-rules', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load rules');
      const data = await res.json();
      setRules(data.rules || []);
    } catch {
      showToast('Failed to load rules', false);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && adminToken && mainTab === 'rules') fetchRules(adminToken);
  }, [authed, adminToken, mainTab, fetchRules]);

  // ── Fetch sites ───────────────────────────────────────────────
  const fetchSites = useCallback(async (token: string) => {
    setSitesLoading(true);
    try {
      const res = await fetch('/api/admin-sites', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load sites');
      const data = await res.json();
      setSites(data.sites || []);
    } catch {
      showToast('Failed to load sites', false);
    } finally {
      setSitesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && adminToken && mainTab === 'sites') fetchSites(adminToken);
  }, [authed, adminToken, mainTab, fetchSites]);

  // ── Toggle site enabled ──────────────────────────────────────
  const handleToggleSite = async (site: MonitoredSite) => {
    if (siteActionId) return;
    setSiteActionId(site.id);
    try {
      const res = await fetch('/api/admin-sites', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: site.id, enabled: !site.enabled }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setSites(prev => prev.map(s => s.id === site.id ? { ...s, enabled: !s.enabled } : s));
    } catch {
      showToast('Failed to update site', false);
    } finally {
      setSiteActionId(null);
    }
  };

  // ── Delete site ──────────────────────────────────────────────
  const handleDeleteSite = async (site: MonitoredSite) => {
    if (siteActionId) return;
    setSiteActionId(site.id);
    try {
      const res = await fetch('/api/admin-sites', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: site.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSites(prev => prev.filter(s => s.id !== site.id));
      showToast(`Site "${site.hostname}" removed`);
    } catch {
      showToast('Failed to delete site', false);
    } finally {
      setSiteActionId(null);
    }
  };

  // ── Add site ─────────────────────────────────────────────────
  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteHostname) return;
    setSiteActionId('new');
    try {
      const res = await fetch('/api/admin-sites', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: newSiteHostname.trim(), label: newSiteLabel.trim() || newSiteHostname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.site) setSites(prev => [...prev, data.site].sort((a, b) => a.hostname.localeCompare(b.hostname)));
      setNewSiteHostname('');
      setNewSiteLabel('');
      setShowAddSite(false);
      showToast(`✓ "${newSiteHostname}" added to monitored sites`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add site', false);
    } finally {
      setSiteActionId(null);
    }
  };

  // ── Toggle rule enabled ──────────────────────────────────────
  const handleToggleRule = async (rule: Rule) => {
    if (ruleActionId) return;
    setRuleActionId(rule.id);
    try {
      const res = await fetch('/api/admin-rules', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
    } catch {
      showToast('Failed to update rule', false);
    } finally {
      setRuleActionId(null);
    }
  };

  // ── Delete rule ──────────────────────────────────────────────
  const handleDeleteRule = async (rule: Rule) => {
    if (ruleActionId) return;
    setRuleActionId(rule.id);
    try {
      const res = await fetch('/api/admin-rules', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setRules(prev => prev.filter(r => r.id !== rule.id));
      showToast(`Rule "${rule.name}" deleted`);
    } catch {
      showToast('Failed to delete rule', false);
    } finally {
      setRuleActionId(null);
    }
  };

  // ── Add rule ─────────────────────────────────────────────────
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.label || !newRule.pattern) return;
    setRuleActionId('new');
    try {
      const res = await fetch('/api/admin-rules', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.rule) setRules(prev => [...prev, data.rule]);
      setNewRule({ name: '', label: '', category: 'pii', severity: 'high', pattern: '', flags: 'g', description: '' });
      setShowAddRule(false);
      showToast(`✓ Rule "${newRule.name}" added`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add rule', false);
    } finally {
      setRuleActionId(null);
    }
  };

  // ── Handle token submit ──────────────────────────────────────
  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    setTokenError('');

    // Quick validation — actually call the API to check
    const res = await fetch('/api/admin-orgs', {
      headers: { 'Authorization': `Bearer ${trimmed}` },
    });
    if (res.status === 401) {
      setTokenError('Incorrect token. Check your ADMIN_TOKEN env var.');
      return;
    }
    sessionStorage.setItem(SESSION_KEY, trimmed);
    setAdminToken(trimmed);
    setAuthed(true);
  };

  // ── Approve ──────────────────────────────────────────────────
  const handleApprove = async (org: Org) => {
    if (actionId) return;
    setActionId(org.id);
    try {
      const res = await fetch('/api/admin-approve', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: org.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`✓ ${org.name} approved — magic link sent to ${org.admin_email}`);
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, status: 'approved', active: true } : o));
      setStats(prev => prev ? { ...prev, pending: prev.pending - 1, approved: prev.approved + 1 } : prev);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Approval failed', false);
    } finally {
      setActionId(null);
    }
  };

  // ── Reject ───────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectTarget || actionId) return;
    const org = rejectTarget;
    setRejectTarget(null);
    setActionId(org.id);
    try {
      const res = await fetch('/api/admin-reject', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: org.id, reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`${org.name} rejected.`);
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, status: 'rejected', active: false } : o));
      setStats(prev => prev ? { ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 } : prev);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Rejection failed', false);
    } finally {
      setActionId(null);
      setRejectReason('Domain could not be verified.');
    }
  };

  // ── Activate / Extend subscription ──────────────────────────
  const handleActivate = async () => {
    if (!activateTarget || actionId) return;
    const org = activateTarget;
    setActivateTarget(null);
    setActionId(org.id);
    try {
      const res = await fetch('/api/admin-activate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId:  org.id,
          plan:   activatePlan,
          seats:  Number(activateSeats),
          action: activateAction,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const endDate = fmtDate(data.subscription_ends_at);
      showToast(`✓ ${org.name} subscription ${activateAction === 'extend' ? 'extended' : 'activated'} until ${endDate}`);
      setOrgs(prev => prev.map(o => o.id === org.id
        ? {
            ...o,
            subscription_status:  'active',
            subscription_ends_at: data.subscription_ends_at,
            plan:  activatePlan,
            seats: Number(activateSeats),
            active: true,
          }
        : o
      ));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Activation failed', false);
    } finally {
      setActionId(null);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setAdminToken('');
    setTokenInput('');
  };

  const filtered = orgs.filter(o => filter === 'all' || o.status === filter);

  // ════════════════════════════════════════════════
  // TOKEN GATE SCREEN
  // ════════════════════════════════════════════════
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 justify-center mb-8">
            <Lock className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">Owner Admin</span>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/30 p-6">
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Enter your admin token to access the owner panel.
            </p>
            <form onSubmit={handleTokenSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="Admin token…"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                className="bg-background/50 font-mono"
                autoFocus
              />
              {tokenError && <p className="text-xs text-red-400">{tokenError}</p>}
              <Button variant="hero" className="w-full" type="submit">
                Unlock Panel
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-muted-foreground/40 mt-4">
            Set ADMIN_TOKEN in Vercel environment variables
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════
  // ADMIN PANEL
  // ════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#080c14] text-[#dde9f8]">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl border
          ${toast.ok
            ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-300'
            : 'bg-red-900/80 border-red-500/30 text-red-300'}`}>
          {toast.msg}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-[#12121f] border border-border/50 rounded-xl p-6">
            <h2 className="text-base font-bold mb-1">Reject: {rejectTarget.name}</h2>
            <p className="text-xs text-muted-foreground mb-4">
              This will email {rejectTarget.admin_email} with the reason below.
            </p>
            <textarea
              className="w-full bg-background/50 border border-border/50 rounded-lg p-3 text-sm text-foreground resize-none focus:outline-none focus:border-primary h-20 mb-4"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Rejection reason…"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button
                variant="destructive" size="sm"
                onClick={handleReject}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activate / Extend subscription modal */}
      {activateTarget && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-[#12121f] border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base font-bold">
                {activateAction === 'extend' ? 'Extend Subscription' : 'Activate Subscription'}
              </h2>
            </div>
            <p className="text-sm font-semibold text-indigo-300 mb-1">{activateTarget.name}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {activateAction === 'extend'
                ? 'Adds 12 months from the current end date (or today if already expired). Resets renewal warning flags.'
                : 'Starts a 12-month subscription from today. Sets the org to active and sends a confirmation email.'}
            </p>

            <div className="space-y-3 mb-5">
              {/* Action toggle */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Action</label>
                <div className="flex gap-2">
                  {(['activate', 'extend'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setActivateAction(a)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize
                        ${activateAction === a
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-transparent text-muted-foreground border-border/40 hover:bg-white/5'}`}
                    >
                      {a === 'activate' ? '✨ New (12 mo from today)' : '🔄 Extend (+12 mo)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan picker */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Plan</label>
                <select
                  className="w-full bg-[#0c1422] border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500/60"
                  value={activatePlan}
                  onChange={e => setActivatePlan(e.target.value)}
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {/* Seats */}
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Licensed Seats</label>
                <Input
                  type="number"
                  min={1}
                  value={activateSeats}
                  onChange={e => setActivateSeats(e.target.value)}
                  className="bg-[#0c1422] font-mono border-border/50 focus:border-indigo-500/60"
                  placeholder="25"
                />
              </div>
            </div>

            {/* Current subscription info */}
            {activateTarget.subscription_ends_at && (
              <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground/70 bg-white/5 rounded-lg px-3 py-2">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Current end: <span className="font-semibold text-foreground/70 ml-1">{fmtDate(activateTarget.subscription_ends_at)}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setActivateTarget(null)}>Cancel</Button>
              <button
                onClick={handleActivate}
                disabled={!!actionId}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold
                  bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/35
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="h-3.5 w-3.5" />
                {activateAction === 'extend' ? 'Extend 12 Months' : 'Activate Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#1c2d45] bg-[#0c1422] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <span className="font-bold text-base">SentraShield Owner Admin</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">PRIVATE</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrgs(adminToken)}
            className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 border-b border-[#1c2d45]">
          {[
            { label: 'Total Orgs',  value: stats.total,    color: 'text-foreground' },
            { label: 'Pending',     value: stats.pending,  color: 'text-amber-400'  },
            { label: 'Approved',    value: stats.approved, color: 'text-emerald-400'},
            { label: 'Rejected',    value: stats.rejected, color: 'text-red-400'    },
          ].map(s => (
            <div key={s.label} className="bg-[#080c14] px-6 py-4 border-r border-[#1c2d45] last:border-r-0">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main tab navigation */}
      <div className="flex gap-1 px-6 py-3 border-b border-[#1c2d45] bg-[#080c14]">
        <button
          onClick={() => setMainTab('orgs')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors
            ${mainTab === 'orgs'
              ? 'bg-primary/15 text-primary border border-primary/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
        >
          <Building2 className="h-3.5 w-3.5" /> Organizations
        </button>
        <button
          onClick={() => setMainTab('rules')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors
            ${mainTab === 'rules'
              ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Detection Rules
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold">
            {rules.filter(r => r.enabled).length}/{rules.length}
          </span>
        </button>
        <button
          onClick={() => setMainTab('sites')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors
            ${mainTab === 'sites'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
        >
          <Globe className="h-3.5 w-3.5" /> Monitored Sites
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold">
            {sites.filter(s => s.enabled).length}/{sites.length}
          </span>
        </button>
      </div>

      {/* ── Rules Panel ─────────────────────────────────────── */}
      {mainTab === 'rules' && (
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Detection Rules</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rules are synced to all extensions every 30 min. All matching is local — zero data sent to AI.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchRules(adminToken)}
                className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${rulesLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowAddRule(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/25 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Rule
              </button>
            </div>
          </div>

          {/* Add rule form */}
          {showAddRule && (
            <form onSubmit={handleAddRule} className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-violet-300 mb-2">New Detection Rule</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Name (slug)</label>
                  <Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. apiKey" className="bg-background/50 font-mono text-xs border-border/50" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Label (display)</label>
                  <Input value={newRule.label} onChange={e => setNewRule(p => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. API Key" className="bg-background/50 text-xs border-border/50" required />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Regex Pattern</label>
                <Input value={newRule.pattern} onChange={e => setNewRule(p => ({ ...p, pattern: e.target.value }))}
                  placeholder={String.raw`e.g. \b[A-Za-z0-9]{32}\b`} className="bg-background/50 font-mono text-xs border-border/50" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Category</label>
                  <select value={newRule.category} onChange={e => setNewRule(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#0c1422] border border-border/50 rounded-lg px-2 py-2 text-xs text-foreground focus:outline-none">
                    <option value="pii">PII</option>
                    <option value="credentials">Credentials</option>
                    <option value="financial">Financial</option>
                    <option value="network">Network</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Severity</label>
                  <select value={newRule.severity} onChange={e => setNewRule(p => ({ ...p, severity: e.target.value }))}
                    className="w-full bg-[#0c1422] border border-border/50 rounded-lg px-2 py-2 text-xs text-foreground focus:outline-none">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Flags</label>
                  <Input value={newRule.flags} onChange={e => setNewRule(p => ({ ...p, flags: e.target.value }))}
                    placeholder="g" className="bg-background/50 font-mono text-xs border-border/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description (optional)</label>
                <Input value={newRule.description} onChange={e => setNewRule(p => ({ ...p, description: e.target.value }))}
                  placeholder="What this rule detects…" className="bg-background/50 text-xs border-border/50" />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddRule(false)}>Cancel</Button>
                <button type="submit" disabled={!!ruleActionId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/35
                    transition-colors disabled:opacity-50">
                  <Plus className="h-3.5 w-3.5" />
                  {ruleActionId === 'new' ? 'Adding…' : 'Add Rule'}
                </button>
              </div>
            </form>
          )}

          {/* Rules list */}
          {rulesLoading && rules.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">Loading…</div>
          ) : rules.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">No rules found</div>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => {
                const severityColor = {
                  critical: 'text-red-400 border-red-500/25 bg-red-500/5',
                  high:     'text-orange-400 border-orange-500/25 bg-orange-500/5',
                  medium:   'text-yellow-400 border-yellow-500/25 bg-yellow-500/5',
                  low:      'text-blue-400 border-blue-500/25 bg-blue-500/5',
                }[rule.severity] ?? 'text-muted-foreground border-border/25 bg-white/5';

                return (
                  <div key={rule.id}
                    className={`rounded-xl border p-4 transition-opacity ${rule.enabled ? '' : 'opacity-50'} border-[#1c2d45] bg-[#080c14]`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs font-bold text-foreground">{rule.name}</span>
                          <span className="text-xs text-muted-foreground">{rule.label}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase ${severityColor}`}>
                            {rule.severity}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-[#1c2d45] text-muted-foreground capitalize">
                            {rule.category}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground/70 bg-black/20 rounded px-2 py-1 mt-1.5 break-all">
                          /{rule.pattern}/{rule.flags}
                        </div>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground/60 mt-1.5">{rule.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          disabled={!!ruleActionId}
                          title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                          className="p-1.5 rounded-md hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                          {rule.enabled
                            ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                            : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          disabled={!!ruleActionId}
                          title="Delete rule"
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Sites Panel ─────────────────────────────────────── */}
      {mainTab === 'sites' && (
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Monitored Sites</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sites synced to all extensions every 60 min. Disable a site to stop monitoring it without deleting it.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSites(adminToken)}
                className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${sitesLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowAddSite(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/25 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Site
              </button>
            </div>
          </div>

          {/* Add site form */}
          {showAddSite && (
            <form onSubmit={handleAddSite} className="mb-4 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-teal-300 mb-2">Add Monitored Site</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Hostname</label>
                  <Input
                    value={newSiteHostname}
                    onChange={e => setNewSiteHostname(e.target.value)}
                    placeholder="e.g. chat.openai.com"
                    className="bg-background/50 font-mono text-xs border-border/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Label (display)</label>
                  <Input
                    value={newSiteLabel}
                    onChange={e => setNewSiteLabel(e.target.value)}
                    placeholder="e.g. ChatGPT"
                    className="bg-background/50 text-xs border-border/50"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddSite(false)}>Cancel</Button>
                <button
                  type="submit"
                  disabled={!!siteActionId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/35
                    transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {siteActionId === 'new' ? 'Adding…' : 'Add Site'}
                </button>
              </div>
            </form>
          )}

          {/* Sites list */}
          {sitesLoading && sites.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">Loading…</div>
          ) : sites.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">No monitored sites found</div>
          ) : (
            <div className="space-y-2">
              {sites.map(site => (
                <div
                  key={site.id}
                  className={`rounded-xl border p-4 transition-opacity ${site.enabled ? '' : 'opacity-50'} border-[#1c2d45] bg-[#080c14]`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Globe className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                        <span className="font-mono text-xs font-bold text-foreground">{site.hostname}</span>
                        {site.label && site.label !== site.hostname && (
                          <span className="text-xs text-muted-foreground">{site.label}</span>
                        )}
                        {site.enabled ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border border-teal-500/25 bg-teal-500/5 text-teal-400 uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border border-border/25 bg-white/5 text-muted-foreground uppercase">
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleSite(site)}
                        disabled={!!siteActionId}
                        title={site.enabled ? 'Disable site' : 'Enable site'}
                        className="p-1.5 rounded-md hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        {site.enabled
                          ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                          : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      <button
                        onClick={() => handleDeleteSite(site)}
                        disabled={!!siteActionId}
                        title="Remove site"
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Orgs Panel ──────────────────────────────────────── */}
      {mainTab === 'orgs' && <>

      {/* Filter tabs */}
      <div className="flex gap-1 px-6 py-3 border-b border-[#1c2d45] bg-[#0c1422]">
        {(['pending', 'all', 'approved', 'rejected'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize
              ${filter === f
                ? 'bg-primary/15 text-primary border border-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
          >
            {f} {f !== 'all' && stats ? `(${stats[f as keyof Stats]})` : ''}
          </button>
        ))}
      </div>

      {/* Org list */}
      <div className="p-6 space-y-3 max-w-5xl mx-auto">
        {loading && orgs.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 text-sm">
            {filter === 'pending' ? '🎉 No pending applications' : 'No records found'}
          </div>
        ) : filtered.map(org => (
          <div
            key={org.id}
            className={`rounded-xl border p-5 transition-colors ${
              org.status === 'pending'
                ? 'border-amber-500/20 bg-amber-500/5'
                : org.status === 'approved'
                ? 'border-emerald-500/15 bg-[#080c14]'
                : 'border-[#1c2d45] bg-[#080c14] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: org details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-sm text-foreground">{org.name}</span>
                  <StatusBadge status={org.status} />
                  {org.subscription_status && org.subscription_status !== 'trial' && (
                    <SubscriptionBadge status={org.subscription_status} endsAt={org.subscription_ends_at} />
                  )}
                  <span className="text-xs text-muted-foreground/60 ml-auto">{timeAgo(org.created_at)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{org.full_name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{org.job_title || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{org.admin_email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono">{org.domain || '—'}</span>
                  </div>
                </div>

                {/* Domain mismatch warning */}
                {org.domain && org.admin_email && !org.admin_email.endsWith(`@${org.domain}`) && !org.admin_email.endsWith(`.${org.domain}`) && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Email domain doesn't match claimed company domain — review carefully
                  </div>
                )}

                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground/50 flex-wrap">
                  {org.status === 'approved' ? (
                    <a
                      href={`https://${org.slug}.ai-dlp.sentrashield.com/dashboard`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      {org.slug}.ai-dlp.sentrashield.com
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : (
                    <span className="font-mono text-xs">{org.slug}.ai-dlp.sentrashield.com</span>
                  )}
                  {org.seats_used !== null && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {org.seats_used} seat{org.seats_used !== 1 ? 's' : ''}
                      {org.seats ? ` / ${org.seats} licensed` : ''}
                    </span>
                  )}
                  <span className="capitalize">Plan: {org.plan}</span>
                </div>

                {/* Subscription date row */}
                {org.status === 'approved' && org.subscription_ends_at && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground/50">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {org.subscription_status === 'active' ? 'Sub until' : 'Sub ended'}:&nbsp;
                    <span className={`font-semibold ${
                      org.subscription_status === 'expired' ? 'text-red-400/70' : 'text-muted-foreground/70'
                    }`}>
                      {fmtDate(org.subscription_ends_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: action buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                {org.status === 'approved' && (
                  <>
                    <a
                      href={`https://${org.slug}.ai-dlp.sentrashield.com/dashboard`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25
                        transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open Dashboard
                    </a>
                    <button
                      onClick={() => {
                        setActivateTarget(org);
                        setActivateAction(org.subscription_status === 'active' ? 'extend' : 'activate');
                        setActivatePlan(org.plan || 'professional');
                        setActivateSeats(String(org.seats ?? 25));
                      }}
                      disabled={!!actionId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25
                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      {actionId === org.id ? 'Working…' : org.subscription_status === 'active' ? 'Extend' : 'Activate'}
                    </button>
                  </>
                )}
                {org.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(org)}
                      disabled={!!actionId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25
                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {actionId === org.id ? 'Working…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => { setRejectTarget(org); }}
                      disabled={!!actionId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25
                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      </>}
    </div>
  );
};

export default OwnerAdmin;
