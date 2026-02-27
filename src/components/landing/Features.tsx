import { ShieldAlert, Scan, Bell, BarChart3, Users, Plug } from "lucide-react";

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

const Features = () => {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center mb-16 accent-line-center">
          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl mb-4 uppercase">
            Your team uses AI. <span className="text-gradient">Keep it safe.</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            AI Shield sits between your employees and AI tools — catching sensitive data before it becomes a breach.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded border border-border/50 card-gradient p-6 transition-all duration-300 hover:border-primary/40 hover:glow"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
