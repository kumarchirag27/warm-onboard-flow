import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { ShieldCheck, Zap, Eye, Globe } from "lucide-react";

interface CounterProps {
  to: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
}

const AnimatedCounter = ({ to, suffix = "", prefix = "", label, duration = 1800 }: CounterProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * to));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-bold text-gradient sm:text-4xl font-mono">
        {prefix}{count}{suffix}
      </div>
      <div className="mt-1.5 text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "No data leaves the device",
    body: "All detection runs locally in the browser. SentraShield never receives your text.",
  },
  {
    icon: Zap,
    title: "<50ms detection latency",
    body: "Regex scanning completes before the browser dispatches the paste event.",
  },
  {
    icon: Eye,
    title: "25+ built-in DLP patterns",
    body: "API keys, PII, credentials, financial data — covering OWASP and UAE PDPL requirements.",
  },
  {
    icon: Globe,
    title: "Works on any AI site",
    body: "ChatGPT, Claude, Gemini, Perplexity, Copilot — any web-based LLM with a text input.",
  },
];

interface TrustCardProps {
  icon: React.ElementType;
  title: string;
  body: string;
}

const TrustCard = ({ icon: Icon, title, body }: TrustCardProps) => {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="reveal flex gap-3 items-start">
      <div className="shrink-0 mt-0.5 rounded bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold mb-0.5">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  );
};

const SocialProof = () => {
  const headingRef = useScrollReveal();
  const statsRef   = useScrollReveal<HTMLDivElement>(0.2);

  return (
    <section className="relative py-20 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div
          ref={headingRef as React.RefObject<HTMLDivElement>}
          className="reveal text-center mb-14"
        >
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-3">
            Why teams choose AI Shield
          </p>
          <h2 className="text-2xl font-bold tracking-wide sm:text-3xl">
            Privacy-first DLP, <span className="text-gradient">built for AI</span>
          </h2>
        </div>

        {/* Trust points grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-16">
          {TRUST_POINTS.map((tp) => (
            <TrustCard key={tp.title} {...tp} />
          ))}
        </div>

        {/* Animated counters */}
        <div
          ref={statsRef}
          className="reveal grid grid-cols-2 gap-8 sm:grid-cols-4 rounded glass px-8 py-10"
        >
          <AnimatedCounter to={25}  suffix="+"  label="DLP patterns built-in" />
          <AnimatedCounter to={50}  prefix="<"  suffix="ms" label="Detection latency" />
          <AnimatedCounter to={7}   suffix=" day" label="Free trial, no card" />
          <AnimatedCounter to={100} suffix="%"  label="Client-side — no data sent" />
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
