import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const BASE_DOMAIN = 'secai.sentrashield.com';

function generateApiKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `ss_trial_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

function generateSlug(orgName: string): string {
  return orgName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20) || `org${Date.now().toString(36)}`;
}

const Signup = () => {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');
  const [orgUrl, setOrgUrl]   = useState('');
  const [formData, setFormData] = useState({ orgName: '', fullName: '', email: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError('');

    try {
      // Check if email already has an org
      const { data: existingEmail } = await supabase
        .from('organizations')
        .select('id')
        .eq('admin_email', formData.email)
        .maybeSingle();

      if (existingEmail) {
        setError('An account with this email already exists. Please log in.');
        setLoading(false);
        return;
      }

      // Generate unique slug from org name
      let slug = generateSlug(formData.orgName);
      const { data: existingSlug } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      // If slug taken, append random suffix
      if (existingSlug) {
        slug = `${slug.slice(0, 14)}${Math.random().toString(36).slice(2, 7)}`;
      }

      // Create organization
      const { error: insertError } = await supabase
        .from('organizations')
        .insert({
          name:        formData.orgName,
          admin_email: formData.email,
          api_key:     generateApiKey(),
          slug,
          plan:        'trial',
          active:      true,
          policy:      'warn',
        });

      if (insertError) throw insertError;

      // Build org-specific dashboard URL
      const dashboardUrl = `https://${slug}.${BASE_DOMAIN}/dashboard`;
      setOrgUrl(`https://${slug}.${BASE_DOMAIN}`);

      // Send magic link → org's subdomain
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: { emailRedirectTo: dashboardUrl },
      });

      if (authError) throw authError;

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────
  if (done) {
    return (
      <div className="relative min-h-screen flex items-center justify-center hero-gradient">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="relative z-10 w-full max-w-md px-6 text-center">
          <CheckCircle className="mx-auto h-14 w-14 text-primary mb-5" />
          <h1 className="text-2xl font-bold mb-3 uppercase tracking-wide">You're all set!</h1>
          <p className="text-muted-foreground mb-6">
            We sent a magic link to{' '}
            <span className="text-foreground font-semibold">{formData.email}</span>.
            <br />Click it to open your dashboard.
          </p>

          {/* Org URL card */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-left mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">Your organization's URL</p>
            <a
              href={orgUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-primary font-mono text-sm font-semibold hover:underline break-all"
            >
              {orgUrl}
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            </a>
            <p className="text-xs text-muted-foreground mt-2">
              Share this link with your team — this is their login URL.
            </p>
          </div>

          <p className="text-xs text-muted-foreground opacity-60">
            Your trial API key has been generated and is ready to use.
          </p>
        </div>
      </div>
    );
  }

  // ── Signup form ─────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex items-center justify-center hero-gradient">
      <div className="absolute inset-0 bg-glow pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <img src="/logo.png" alt="SentraShield" className="h-11 w-auto" />
        </Link>

        <div className="rounded-xl border border-border/50 card-gradient p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1">
              {step === 1 ? 'Create your account' : 'Set up your organization'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? '14-day free trial. No credit card required.'
                : "We'll create your own private dashboard URL."}
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2 justify-center">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'w-12 bg-primary' : 'w-8 bg-border'}`} />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Jane Doe" required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="jane@company.com" required className="bg-background/50" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input id="orgName" name="orgName" value={formData.orgName} onChange={handleChange} placeholder="Acme Corp" required className="bg-background/50" />
                </div>
                {formData.orgName && (
                  <p className="text-xs text-muted-foreground">
                    Your URL:{' '}
                    <span className="text-primary font-mono">
                      {generateSlug(formData.orgName)}.{BASE_DOMAIN}
                    </span>
                  </p>
                )}
              </>
            )}

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : step === 1 ? 'Continue' : 'Start Free Trial'}
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
            <button type="button" onClick={() => setStep(1)} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
