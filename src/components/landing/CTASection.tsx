import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const CTASection = () => {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-24 lg:py-32 border-t border-border/40">
      {/* Background glow */}
      <div className="absolute inset-0 bg-glow pointer-events-none opacity-60" />

      <div className="container relative z-10 mx-auto px-6">
        <div
          ref={ref}
          className="reveal mx-auto max-w-2xl rounded border border-primary/20 card-gradient glow p-10 lg:p-14 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-mono text-primary tracking-widest mb-6">
            7-DAY FREE TRIAL · NO CARD REQUIRED
          </div>

          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl lg:text-5xl mb-4 uppercase">
            Start protecting your team
            <br />
            <span className="text-gradient">today</span>
          </h2>

          <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            Deploy in under a minute. Your team keeps using AI tools — AI Shield makes sure
            nothing sensitive slips through.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="lg" className="text-base px-10 w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/personal">
              <Button variant="heroOutline" size="lg" className="text-base px-8 w-full sm:w-auto">
                Personal (Free)
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            No proxy · No VPN · No data sent to our servers
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
