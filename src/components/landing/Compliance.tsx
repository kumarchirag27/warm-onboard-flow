import { ShieldCheck } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const badges = [
  {
    name: "SOC 2 Ready",
    desc: "Audit-ready event logs and access controls built in",
    color: "border-primary/30 bg-primary/5",
  },
  {
    name: "GDPR Compliant",
    desc: "No personal data leaves the browser. Zero cloud storage of content",
    color: "border-secondary/30 bg-secondary/5",
  },
  {
    name: "UAE NESA Aligned",
    desc: "Supports NESA Information Assurance controls for critical sectors",
    color: "border-primary/30 bg-primary/5",
  },
  {
    name: "ISO 27001 Ready",
    desc: "Evidence collection and policy enforcement for ISO certification",
    color: "border-secondary/30 bg-secondary/5",
  },
];

const Compliance = () => {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-20 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div ref={ref} className="reveal mx-auto max-w-2xl text-center mb-12 accent-line-center">
          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl mb-4 uppercase">
            Built for <span className="text-gradient">compliance teams</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Regulatory requirements don't pause for AI adoption. AI Shield helps you stay ahead.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {badges.map(({ name, desc, color }) => (
            <div
              key={name}
              className={`rounded border ${color} p-5 flex flex-col gap-3 transition-all duration-300 hover:glow`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-semibold text-sm">{name}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Compliance;
