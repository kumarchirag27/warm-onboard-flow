import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase, DASHBOARD_URL } from "@/lib/supabase";

const Login = () => {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Verify this email belongs to a registered org
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('admin_email', email)
      .eq('active', true)
      .maybeSingle();

    if (!org) {
      setError('No account found with this email. Start a free trial first.');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: DASHBOARD_URL },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  // ── Success screen ──────────────────────────────────────────
  if (done) {
    return (
      <div className="relative min-h-screen flex items-center justify-center hero-gradient">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="relative z-10 w-full max-w-md px-6 text-center">
          <CheckCircle className="mx-auto h-14 w-14 text-primary mb-5" />
          <h1 className="text-2xl font-bold mb-3 uppercase tracking-wide">Check your inbox</h1>
          <p className="text-muted-foreground">
            We sent a magic link to{' '}
            <span className="text-foreground font-semibold">{email}</span>.
            <br />Click it to access your dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ── Login form ──────────────────────────────────────────────
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
            <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              We'll send a magic link to your inbox — no password needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email" type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="jane@company.com"
                required
                className="bg-background/50"
              />
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send Magic Link'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
