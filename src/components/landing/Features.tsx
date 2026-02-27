import { Shield, Zap, Eye, Lock, BarChart3, Globe } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Threat Detection",
    description: "AI-powered real-time threat monitoring that identifies and neutralizes attacks before they impact your systems.",
  },
  {
    icon: Zap,
    title: "Automated Response",
    description: "Instant automated incident response with customizable playbooks that reduce mean-time-to-resolution by 90%.",
  },
  {
    icon: Eye,
    title: "Continuous Monitoring",
    description: "24/7 surveillance across your entire infrastructure with intelligent alerting that eliminates false positives.",
  },
  {
    icon: Lock,
    title: "Zero Trust Access",
    description: "Granular identity-based access controls with continuous verification for every user, device, and application.",
  },
  {
    icon: BarChart3,
    title: "Compliance Dashboard",
    description: "Real-time compliance tracking for SOC 2, HIPAA, GDPR, and ISO 27001 with automated evidence collection.",
  },
  {
    icon: Globe,
    title: "Global Edge Network",
    description: "Distributed security infrastructure across 40+ regions ensuring low-latency protection worldwide.",
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Security that <span className="text-gradient">scales with you</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to protect, detect, and respond — built for modern infrastructure.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-border/50 card-gradient p-6 transition-all duration-300 hover:border-primary/30 hover:glow"
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
