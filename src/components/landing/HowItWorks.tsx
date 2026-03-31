import { Chrome, ScanSearch, ShieldCheck, type LucideIcon } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface StepCardProps {
  icon: LucideIcon;
  step: string;
  title: string;
  body: string;
  detail: string;
  delay: number;
}

const StepCard = ({ icon: Icon, step, title, body, detail, delay }: StepCardProps) => {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}s` }}
      className="reveal relative flex flex-col items-center text-center"
    >
      <div className="relative z-10 mb-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full border border-primary/30 bg-primary/8 flex items-center justify-center mb-3 glow">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <span className="text-xs font-mono text-primary/60 tracking-widest">{step}</span>
      </div>
      <div className="rounded border border-border/50 card-gradient p-6 w-full h-full">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{body}</p>
        <span className="inline-block text-xs font-mono text-primary bg-primary/8 border border-primary/20 rounded px-2.5 py-1">
          {detail}
        </span>
      </div>
    </div>
  );
};

const steps = [
  {
    icon: Chrome,
    step: "01",
    title: "Install in seconds",
    body: "Add the Chrome extension from the Web Store or push it org-wide via MDM. No VPN, no proxy, no infrastructure changes.",
    detail: "~30 seconds to deploy",
  },
  {
    icon: ScanSearch,
    step: "02",
    title: "AI detects in real time",
    body: "Every paste into ChatGPT, Claude, Gemini, or any AI tool is scanned locally in the browser — 25+ sensitive data patterns, custom regex supported.",
    detail: "<50ms per scan",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Blocks and logs it",
    body: "Hard-block, user warning, or silent log — your policy, per pattern. Every event lands in the admin audit trail with user, site, and data type.",
    detail: "Full audit trail",
  },
];

const HowItWorks = () => {
  const headingRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div ref={headingRef} className="reveal mx-auto max-w-2xl text-center mb-16 accent-line-center">
          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl mb-4 uppercase">
            Up and running <span className="text-gradient">in 30 seconds</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            No proxies, no network changes, no data leaving your device.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[calc(33.3%+1rem)] right-[calc(33.3%+1rem)] h-px bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30 pointer-events-none" />

          {steps.map((s, i) => (
            <StepCard key={s.step} {...s} delay={i * 0.12} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
