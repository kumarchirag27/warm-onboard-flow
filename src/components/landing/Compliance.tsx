import { Award } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

// Helps customers cover these frameworks. AI Shield itself is not the
// certifying body — these are the standards your organisation can
// satisfy faster using the platform.
const badges = [
  { name: "SOC 2",          desc: "Audit-ready event logs and access controls built in for your SOC 2 evidence pack." },
  { name: "GDPR",           desc: "No personal data leaves the browser. Zero cloud storage of content — privacy-by-design." },
  { name: "UAE NESA",       desc: "Helps cover NESA Information Assurance controls relevant to critical sectors." },
  { name: "ISO 27001",      desc: "Evidence collection and policy enforcement to feed your ISO 27001 audit programme." },
  { name: "ISO 42001",      desc: "AI management system controls — policies, monitoring, and audit logs for your AI use." },
  { name: "UAE PDPL",       desc: "Personal data residency and consent enforcement at the browser edge." },
  { name: "HIPAA",          desc: "Healthcare data handling — PHI detection and block at the moment of paste." },
  { name: "PCI DSS 4.0",    desc: "Cardholder data leakage prevention from browser forms and uploads." },
];

const Compliance = () => {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-20 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div ref={ref} className="reveal mx-auto max-w-2xl text-center mb-4 accent-line-center">
          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl mb-4 uppercase">
            Frameworks the platform <span className="text-gradient">currently supports</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            AI Shield ships with detections, evidence, and policy enforcement mapped to the controls below — so your auditors get what they need without spreadsheets.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto mt-10">
          {badges.map(({ name, desc }) => (
            <div
              key={name}
              className="rounded border border-primary/30 bg-primary/5 p-5 flex flex-col gap-3 transition-all duration-300 hover:glow"
            >
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#F5C542] flex-shrink-0" />
                <span className="font-semibold text-sm">{name}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Additional frameworks can be added on request — talk to us about your audit pack.
        </p>
      </div>
    </section>
  );
};

export default Compliance;
