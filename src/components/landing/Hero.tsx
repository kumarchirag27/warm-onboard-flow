import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Lock, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-glow pointer-events-none" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="container relative z-10 mx-auto px-6 pt-24 pb-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Shield className="h-3.5 w-3.5" />
            <span>Enterprise-Grade Security Platform</span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Protect your business
            <br />
            <span className="text-gradient">before threats arrive</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            SentraShield delivers real-time threat detection, automated response, and
            comprehensive compliance monitoring — all in one unified platform.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/signup">
              <Button variant="hero" size="lg" className="text-base px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="heroOutline" size="lg" className="text-base px-8 py-6">
              Book a Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 border-t border-border/50 pt-10">
            {[
              { value: "99.9%", label: "Uptime SLA" },
              { value: "< 2s", label: "Threat Response" },
              { value: "500+", label: "Integrations" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-gradient sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
