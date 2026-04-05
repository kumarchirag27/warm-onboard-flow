import { ShieldAlert, Scan, Bell, BarChart3, Users, Plug } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { type LucideIcon } from "lucide-react";

const features = [
  {
    icon: Scan,
    title: "Real-Time Paste Detection",
    description: "Scans clipboard content the instant your team pastes into ChatGPT, Claude, Gemini, or any web-based AI tool — before the data ever leaves the browser.",
  },
  {
    icon: ShieldAlert,
    title: "Sensitive Data Classification",
    description: "Automatically identifies API keys, passwords, credit card numbers, SSNs, internal code, and custom patterns you define — with zero false-positive fatigue.",
  },
  {
    icon: Bell,
    title: "Block, Warn, or Log",
    description: "Choose your policy per data type: hard-block the paste, show a warning to the user, or silently log it for compliance review.",
  },
  {
    icon: Users,
    title: "Admin Dashboard",
    description: "Centralized control for security teams. See who pasted what, where, and when. Roll out policies across your entire org in one click.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Track data leak trends, top offenders, most-used AI tools, and export audit-ready compliance reports for SOC 2 and GDPR.",
  },
  {
    icon: Plug,
    title: "Seamless Deployment",
    description: "Install via Chrome Web Store or push through MDM. Lightweight extension with no impact on browsing performance.",
  },
];

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: FeatureCardProps) => {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}s` }}
      className="reveal group relative rounded border border-border/50 glass p-6 hover-lift hover:border-primary/40 hover:glow"
    >
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

const Features = () => {
  const headingRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="features" className="relative py-24 lg:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div ref={headingRef} className="reveal mx-auto max-w-2xl text-center mb-16 accent-line-center">
          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl mb-4 uppercase">
            Your team uses AI. <span className="text-gradient">Keep it safe.</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            AI Shield sits between your employees and AI tools — catching sensitive data before it becomes a breach.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
