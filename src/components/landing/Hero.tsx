import { Button } from "@/components/ui/button";
import { ArrowRight, Chrome } from "lucide-react";
import { Link } from "react-router-dom";
import ViolationDemo from "./ViolationDemo";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden hero-gradient">
      {/* Animated mesh blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-float-a absolute top-1/4 left-1/6 w-[480px] h-[480px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="animate-float-b absolute bottom-1/3 right-1/6 w-[400px] h-[400px] rounded-full bg-secondary/6 blur-[80px]" />
        <div className="animate-float-c absolute top-3/4 left-1/2 w-[280px] h-[280px] rounded-full bg-primary/5 blur-[60px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative z-10 mx-auto px-6 pt-24 pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Left: headline + CTAs */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary font-mono tracking-wider">
              <Chrome className="h-3.5 w-3.5" />
              <span>Browser Extension for Teams</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-wide sm:text-5xl xl:text-6xl uppercase">
              Your team is
              <br />
              <span className="text-gradient">leaking data</span>
              <br />
              into AI tools
            </h1>

            <p className="mb-8 max-w-lg text-lg text-muted-foreground leading-relaxed">
              AI Shield catches passwords, API keys, PII, and confidential data the moment
              your team pastes it into ChatGPT, Claude, or any AI assistant — and blocks it
              before it's sent.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row mb-8">
              <Link to="/signup">
                <Button variant="hero" size="lg" className="text-base px-8 w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <a href="https://chrome.google.com/webstore" target="_blank" rel="noreferrer">
                <Button variant="heroOutline" size="lg" className="text-base px-8 w-full sm:w-auto">
                  <Chrome className="mr-1 h-4 w-4" />
                  Add to Chrome — Free
                </Button>
              </a>
            </div>

            {/* Trust micro-copy */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                7-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                No data leaves your device
              </span>
            </div>
          </div>

          {/* Right: live violation demo */}
          <div className="w-full max-w-lg mx-auto lg:mx-0">
            <ViolationDemo />
            <p className="mt-3 text-center text-xs text-muted-foreground font-mono">
              ↑ Live demo — watch AI Shield block an API key leak in real time
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-3 gap-8 border-t border-border/40 pt-10 max-w-2xl mx-auto lg:mx-0">
          {[
            { value: "25+",   label: "DLP patterns built-in" },
            { value: "<50ms", label: "Detection latency"      },
            { value: "500+",  label: "AI sites covered"       },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-gradient sm:text-3xl font-mono">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
