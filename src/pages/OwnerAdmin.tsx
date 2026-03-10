import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, RefreshCw,
  Building2, Briefcase, Mail, Globe, Users, ShieldAlert,
  AlertTriangle, Lock, LogOut,
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
  created_at: string;
}
interface Stats { total: number; pending: number; approved: number; rejected: number; }

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const SESSION_KEY = 'sentra_admin_token';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
const OwnerAdmin = () => {
  const [authed, setAuthed]           = useState(false);
  const [tokenInput, setTokenInput]   = useState('');
  const [tokenError, setTokenError]   = useState('');
  const [adminToken, setAdminToken]   = useState('');

  const [orgs, setOrgs]               = useState<Org[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [filter, setFilter]           = useState<Filter>('pending');
  const [loading, setLoading]         = useState(false);
  const [actionId, setActionId]       = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Org | null>(null);
  const [rejectReason, setRejectReason] = useState('Domain could not be verified.');

  // ── Restore session ──────────────────────────────────────────
  useEffect(() => {
    // Check URL param first (direct link from owner notification email)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      sessionStorage.setItem(SESSION_KEY, urlToken);
      // Clean token from URL
      window.history.replaceState({}, '', '/admin');
      setAdminToken(urlToken);
      setAuthed(true);
      return;
    }
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) { setAdminToken(saved); setAuthed(true); }
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
            {f} {f !== 'all' && stats ? `(${stats[f]})` : ''}
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

                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground/50">
                  <span className="font-mono text-xs">{org.slug}.ai-dlp.sentrashield.com</span>
                  {org.seats_used !== null && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {org.seats_used} seat{org.seats_used !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="capitalize">Plan: {org.plan}</span>
                </div>
              </div>

              {/* Right: action buttons (only for pending) */}
              {org.status === 'pending' && (
                <div className="flex flex-col gap-2 shrink-0">
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
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerAdmin;
