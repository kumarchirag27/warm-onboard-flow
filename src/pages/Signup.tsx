import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Clock, Shield, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const BASE_DOMAIN = 'ai-dlp.sentrashield.com';

// ─────────────────────────────────────────────────────────────
// Security: block known disposable / throwaway email providers
// ─────────────────────────────────────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','tempmail.com','throwam.com','yopmail.com',
  'trashmail.com','sharklasers.com','grr.la','guerrillamail.info','dispostable.com',
  'mailnull.com','spamgourmet.com','trashmail.net','mailnesia.com','throwaway.email',
  '10minutemail.com','20minutemail.com','mytemp.email','fakeinbox.com','tempinbox.com',
  'discard.email','spamgaps.com','boun.cr','yopmail.fr','spamherr.de','owlpic.com',
  'getairmail.com','maildrop.cc','filzmail.com','spam4.me','trashmail.me',
  'jetable.fr.nf','notmailinator.com','spamoff.de','trbvm.com','kurzepost.de',
  'objectmail.com','proxymail.eu','rcpt.at','trash-mail.at','trashmail.at',
  'trashmail.io','spamgourmet.net','mailnull.com','inboxalias.com','spamevader.com',
]);

// Free consumer providers — warn but don't block (slower approval)
const PERSONAL_DOMAINS = new Set([
  'gmail.com','yahoo.com','hotmail.com','outlook.com','live.com',
  'icloud.com','me.com','mac.com','aol.com','protonmail.com',
  'pm.me','tutanota.com','zoho.com','gmx.com','gmx.net','mail.com',
]);

function generateApiKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `ss_trial_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

function generateSlug(orgName: string): string {
  return orgName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
    || `org${Date.now().toString(36)}`;
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0];
}

/** Returns true if the email's domain matches or is a sub-domain of companyDomain */
function emailMatchesDomain(email: string, companyDomain: string): boolean {
  const emailDomain = email.split('@')[1]?.toLowerCase() || '';
  const norm = normalizeDomain(companyDomain);
  return emailDomain === norm || emailDomain.endsWith(`.${norm}`);
}

// ─────────────────────────────────────────────────────────────

const Signup = () => {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');
  const [domainWarning, setDomainWarning] = useState('');
  const [formData, setFormData] = useState({
    fullName: '', jobTitle: '', email: '', orgName: '', companyDomain: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    // Live hint: email domain vs company domain mismatch
    if (name === 'companyDomain' || name === 'email') {
      const email  = name === 'email'         ? value : formData.email;
      const domain = name === 'companyDomain' ? value : formData.companyDomain;
      if (email && domain && !emailMatchesDomain(email, normalizeDomain(domain))) {
        setDomainWarning(
          `Your email (${email.split('@')[1]}) doesn't match the domain (${normalizeDomain(domain)}). ` +
          `This is allowed but may require additional review.`
        );
      } else {
        setDomainWarning('');
      }
    }
  };

  // ── Step 1 validation ────────────────────────────────────────
  const handleStep1 = () => {
    const emailDomain = formData.email.split('@')[1]?.toLowerCase() || '';
    if (DISPOSABLE_DOMAINS.has(emailDomain)) {
      setError('Disposable / temporary email addresses are not allowed. Please use your work email.');
      return;
    }
    setStep(2);
  };

  // ── Final submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { handleStep1(); return; }

    setLoading(true);
    setError('');

    try {
      const domain = normalizeDomain(formData.companyDomain);

      // ① Validate domain format (must look like a real TLD domain)
      if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(domain)) {
        setError('Please enter a valid company domain (e.g. acmecorp.com).');
        setLoading(false);
        return;
      }

      // ② Duplicate domain check — one org per domain
      const { data: existingDomain } = await supabase
        .from('organizations').select('id').eq('domain', domain).maybeSingle();
      if (existingDomain) {
        setError('This domain is already registered. Contact support@sentrashield.com if you believe this is an error.');
        setLoading(false);
        return;
      }

      // ③ Duplicate email check
      const { data: existingEmail } = await supabase
        .from('organizations').select('id').eq('admin_email', formData.email).maybeSingle();
      if (existingEmail) {
        setError('An account with this email already exists. Please log in.');
        setLoading(false);
        return;
      }

      // ④ Generate unique slug
      let slug = generateSlug(formData.orgName);
      const { data: existingSlug } = await supabase
        .from('organizations').select('id').eq('slug', slug).maybeSingle();
      if (existingSlug) {
        slug = `${slug.slice(0, 14)}${Math.random().toString(36).slice(2, 7)}`;
      }

      // ⑤ Create org as INACTIVE / PENDING — no access until owner approves
      const { error: insertError } = await supabase
        .from('organizations')
        .insert({
          name:        formData.orgName,
          full_name:   formData.fullName,
          job_title:   formData.jobTitle,
          admin_email: formData.email,
          domain,
          api_key:     generateApiKey(),
          slug,
          plan:        'trial',
          active:      false,        // ← locked until manual approval
          status:      'pending',    // pending | approved | rejected
          policy:      'warn',
        });

      if (insertError) throw insertError;

      // ⑥ Notify owner (fire-and-forget — non-blocking)
      fetch('/api/notify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName:        formData.orgName,
          fullName:       formData.fullName,
          jobTitle:       formData.jobTitle,
          email:          formData.email,
          domain,
          slug,
          domainMismatch:  !emailMatchesDomain(formData.email, domain),
          isPersonalEmail: PERSONAL_DOMAINS.has(formData.email.split('@')[1]),
        }),
      }).catch(() => {});

      setDone(true);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Under Review success screen ──────────────────────────────
  if (done) {
    return (
      <div className="relative min-h-screen flex items-center justify-center hero-gradient">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="relative z-10 w-full max-w-md px-6 text-center">

          {/* Icon */}
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-400" />
          </div>

          <h1 className="text-2xl font-bold mb-3 uppercase tracking-wide">Application Under Review</h1>
          <p className="text-muted-foreground mb-6">
            Your application for{' '}
            <span className="text-foreground font-semibold">{formData.orgName}</span>{' '}
            has been submitted and is awaiting manual approval by our team.
          </p>

          {/* What happens next */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-left mb-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">📧</span>
              <div>
                <p className="text-sm font-semibold text-foreground">You'll get an email</p>
                <p className="text-xs text-muted-foreground">
                  We'll send your login link to{' '}
                  <span className="text-foreground">{formData.email}</span> once your domain is verified.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">⏱</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Review within ~24 hours</p>
                <p className="text-xs text-muted-foreground">
                  We manually verify each company domain to prevent misuse and fake accounts.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">🔒</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Free trial starts on approval</p>
                <p className="text-xs text-muted-foreground">
                  No credit card needed. Your 7-day trial begins the moment we approve your account.
                </p>
              </div>
            </div>
          </div>

          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            ← Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  // ── Signup form ──────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex items-center justify-center hero-gradient">
      <div className="absolute inset-0 bg-glow pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <img src="/favicon.svg" alt="Sentra AI DLP" className="h-10 w-10" />
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-primary bg-clip-text text-transparent ml-2.5">Sentra AI DLP</span>
        </Link>

        <div className="rounded-xl border border-border/50 card-gradient p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1">
              {step === 1 ? 'Create your account' : 'Set up your organization'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? '7-day free trial. No credit card required.'
                : "Tell us about your company — we'll verify the domain."}
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2 justify-center">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'w-12 bg-primary' : 'w-8 bg-border'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName" name="fullName" value={formData.fullName}
                    onChange={handleChange} placeholder="Jane Doe"
                    required className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job title</Label>
                  <Input
                    id="jobTitle" name="jobTitle" value={formData.jobTitle}
                    onChange={handleChange} placeholder="CISO, IT Manager, Security Engineer…"
                    required className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email" name="email" type="email" value={formData.email}
                    onChange={handleChange} placeholder="jane@company.com"
                    required className="bg-background/50"
                  />
                  {/* Warn (don't block) for personal emails */}
                  {formData.email && PERSONAL_DOMAINS.has(formData.email.split('@')[1]?.toLowerCase()) && (
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      Personal email detected. A work email speeds up domain verification.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName" name="orgName" value={formData.orgName}
                    onChange={handleChange} placeholder="Acme Corp"
                    required className="bg-background/50"
                  />
                  {formData.orgName && (
                    <p className="text-xs text-muted-foreground">
                      Your dashboard URL:{' '}
                      <span className="text-primary font-mono">
                        {generateSlug(formData.orgName)}.{BASE_DOMAIN}
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyDomain">Company domain</Label>
                  <Input
                    id="companyDomain" name="companyDomain" value={formData.companyDomain}
                    onChange={handleChange} placeholder="acmecorp.com"
                    required className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    The domain your employees use for email (e.g. <span className="font-mono">acmecorp.com</span>)
                  </p>
                  {domainWarning && (
                    <p className="text-xs text-amber-400 flex items-start gap-1.5">
                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      {domainWarning}
                    </p>
                  )}
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
              {loading
                ? 'Submitting…'
                : step === 1
                ? 'Continue'
                : 'Submit Application'}
              {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </form>

          {step === 1 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </p>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => { setStep(1); setDomainWarning(''); }}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Trust signals */}
        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
            <Shield className="h-3 w-3" /> Manual domain verification
          </span>
          <span className="text-xs text-muted-foreground/30">·</span>
          <span className="text-xs text-muted-foreground/50">No spam</span>
          <span className="text-xs text-muted-foreground/30">·</span>
          <span className="text-xs text-muted-foreground/50">~24h approval</span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
