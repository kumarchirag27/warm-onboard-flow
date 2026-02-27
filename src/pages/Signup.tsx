import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    orgName: "",
    fullName: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      // TODO: Wire up with Lovable Cloud — create org, send welcome email, redirect to dashboard
      console.log("Signup submitted:", formData);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center hero-gradient">
      <div className="absolute inset-0 bg-glow pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight">AI-DLP</span>
        </Link>

        {/* Card */}
        <div className="rounded-xl border border-border/50 card-gradient p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1">
              {step === 1 ? "Create your account" : "Set up your organization"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? "Start your 14-day free trial. No credit card required."
                : "Tell us about your organization to get started."}
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2 justify-center">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? "w-12 bg-primary" : "w-8 bg-border"
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
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@company.com"
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="bg-background/50"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  required
                  className="bg-background/50"
                />
              </div>
            )}

            <Button variant="hero" className="w-full" type="submit">
              {step === 1 ? "Continue" : "Create Organization"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>

          {step === 1 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
