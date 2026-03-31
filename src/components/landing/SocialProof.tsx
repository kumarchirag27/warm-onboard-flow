import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

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

const LOGOS = [
  "Meridian Tech",
  "Gulf Fintech",
  "Emirates Dev Co",
  "Nexus Systems",
  "ArabNet Labs",
  "Falcon Cloud",
  "Oasis Digital",
  "Dune Analytics",
];

const SocialProof = () => {
  const headingRef = useScrollReveal();
  const statsRef   = useScrollReveal<HTMLDivElement>(0.2);

  return (
    <section className="relative py-20 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div
          ref={headingRef as React.RefObject<HTMLDivElement>}
          className="reveal text-center mb-10"
        >
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-3">
            Trusted by security-first teams
          </p>
          <p className="text-muted-foreground text-base">
            Protecting organizations across the UAE and GCC from AI-driven data leaks
          </p>
        </div>

        {/* Logo marquee */}
        <div className="overflow-hidden mb-14">
          <div className="flex gap-12 marquee-track whitespace-nowrap">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span
                key={i}
                className="text-sm font-semibold text-muted-foreground/50 tracking-wider uppercase inline-block"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Animated counters */}
        <div
          ref={statsRef}
          className="reveal grid grid-cols-2 gap-8 sm:grid-cols-4 border border-border/50 rounded bg-card/50 px-8 py-10"
        >
          <AnimatedCounter to={25}  suffix="+"  label="Data leak patterns blocked" />
          <AnimatedCounter to={98}  suffix="%"  label="Detection accuracy" />
          <AnimatedCounter to={500} suffix="+"  label="Teams protected" />
          <AnimatedCounter to={50}  prefix="<"  suffix="ms"  label="Detection latency" />
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
