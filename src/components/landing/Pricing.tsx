import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "For small teams getting started with security",
    features: [
      "Up to 10 users",
      "Basic threat detection",
      "Email alerts",
      "5 integrations",
      "Community support",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Pro",
    price: "$199",
    period: "/mo",
    description: "For growing organizations with advanced needs",
    features: [
      "Up to 100 users",
      "AI-powered threat detection",
      "Automated incident response",
      "Unlimited integrations",
      "Compliance dashboard",
      "Priority support",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom requirements",
    features: [
      "Unlimited users",
      "Custom threat models",
      "Dedicated SOC team",
      "On-premise deployment",
      "Custom SLAs",
      "24/7 phone support",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="relative py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Simple, <span className="text-gradient">transparent pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Start free. Scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-8 transition-all duration-300 ${
                plan.featured
                  ? "border-primary/50 card-gradient glow scale-105"
                  : "border-border/50 card-gradient hover:border-border"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <Button
                  variant={plan.featured ? "hero" : "heroOutline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
