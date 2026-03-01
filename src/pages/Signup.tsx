import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase, DASHBOARD_URL } from "@/lib/supabase";

function generateApiKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `ss_trial_${hex}`;
}

const Signup = () => {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');
  const [formData, setFormData] = useState({ orgName: '', fullName: '', email: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check for existing account
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('admin_email', formData.email)
        .maybeSingle();

      if (existing) {
        setError('An account with this email already exists. Please log in.');
        setLoading(false);
        return;
      }

      // Create organization with trial API key
      const { error: insertError } = await supabase
        .from('organizations')
        .insert({
          name:        formData.orgName,
          admin_email: formData.email,
          api_key:     generateApiKey(),
          plan:        'trial',
          active:      true,
          policy:      'warn',
        });

      if (insertError) throw insertError;

      // Send magic link → dashboard
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: { emailRedirectTo: DASHBOARD_URL },
      });

      if (authError) throw authError;

      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
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
          <h1 className="text-2xl font-bold mb-3 uppercase tracking-wide">Check your inbox</h1>
          <p className="text-muted-foreground mb-4">
            We sent a magic link to{' '}
            <span className="text-foreground font-semibold">{formData.email}</span>.
            <br />Click it to open your SentraShield dashboard.
          </p>
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

        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-widest uppercase">SentraShield</span>
        </Link>

        {/* Card */}
        <div className="rounded-xl border border-border/50 card-gradient p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1">
              {step === 1 ? 'Create your account' : 'Set up your organization'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? '14-day free trial. No credit card required.'
                : 'Almost there — just tell us your company name.'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2 justify-center">
            {[1, 2].map((s) => (
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
                    id="fullName" name="fullName"
                    value={formData.fullName} onChange={handleChange}
                    placeholder="Jane Doe" required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email" name="email" type="email"
                    value={formData.email} onChange={handleChange}
                    placeholder="jane@company.com" required
                    className="bg-background/50"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName" name="orgName"
                  value={formData.orgName} onChange={handleChange}
                  placeholder="Acme Corp" required
                  className="bg-background/50"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
              {loading
                ? 'Creating account…'
                : step === 1 ? 'Continue' : 'Start Free Trial'}
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
              onClick={() => setStep(1)}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
