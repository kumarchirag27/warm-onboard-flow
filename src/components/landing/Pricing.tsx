import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    period: "forever",
    description: "For individuals protecting themselves",
    features: [
      { text: "10 built-in DLP rules", included: true },
      { text: "Credit card & SSN detection", included: true },
      { text: "Warn mode only", included: true },
      { text: "Works on ChatGPT & Claude", included: true },
      { text: "Hard block mode", included: false },
      { text: "Admin dashboard", included: false },
      { text: "Custom patterns", included: false },
    ],
    cta: "Install Free",
    ctaLink: "/personal",
    featured: false,
    external: false,
  },
  {
    name: "Starter",
    monthlyPrice: 4,
    period: "/user/mo",
    description: "For small teams exploring AI safely",
    features: [
      { text: "Up to 25 users", included: true },
      { text: "All 25 DLP rules", included: true },
      { text: "Block, warn & log policies", included: true },
      { text: "ChatGPT, Claude, Gemini + more", included: true },
      { text: "Basic analytics", included: true },
      { text: "Admin dashboard", included: true },
      { text: "Custom patterns", included: false },
    ],
    cta: "Start Free Trial",
    ctaLink: "/signup",
    featured: false,
    external: false,
  },
  {
    name: "Business",
    monthlyPrice: 12,
    period: "/user/mo",
    description: "For security-conscious organizations",
    features: [
      { text: "Unlimited users", included: true },
      { text: "All 25 DLP rules + custom regex", included: true },
      { text: "Admin dashboard & audit logs", included: true },
      { text: "All AI tools + custom sites", included: true },
      { text: "SOC 2 & GDPR reports", included: true },
      { text: "MDM deployment", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Free Trial",
    ctaLink: "/signup",
    featured: true,
    external: false,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    period: "",
    description: "For large orgs with compliance mandates",
    features: [
      { text: "Everything in Business", included: true },
      { text: "SSO & SCIM provisioning", included: true },
      { text: "Custom integrations & API", included: true },
      { text: "Dedicated success manager", included: true },
      { text: "On-premise option", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Custom contract & billing", included: true },
    ],
    cta: "Contact Sales",
    ctaLink: "/contact",
    featured: false,
    external: false,
  },
];

const PRICING_FAQS = [
  {
    q: "What happens after the 7-day trial?",
    a: "Your team keeps access at the paid rate. We send reminder emails at 3 days and 1 day before expiry. No surprise charges — the extension simply stops enforcing policies if you don't activate.",
  },
  {
    q: "Can I switch plans mid-cycle?",
    a: "Yes. Upgrades take effect immediately and are prorated. Downgrades take effect at the next billing cycle.",
  },
  {
    q: "Is the Free plan really free forever?",
    a: "Yes. The individual Free plan (10 rules, warn mode) requires no account and has no trial period. Install from the Chrome Web Store and it works immediately.",
  },
  {
    q: "How does per-seat pricing work?",
    a: "A seat is one user with the extension installed and active. Admins are not counted as seats. You can adjust seat count monthly — add users any time, remove at next billing cycle.",
  },
];

interface PlanCardProps {
  plan: typeof PLANS[0];
  annual: boolean;
}

const PlanCard = ({ plan, annual }: PlanCardProps) => {
  const ref = useScrollReveal<HTMLDivElement>();

  const price =
    plan.monthlyPrice === null
      ? "Custom"
      : plan.monthlyPrice === 0
      ? "Free"
      : annual
      ? `$${Math.round(plan.monthlyPrice * 0.8)}`
      : `$${plan.monthlyPrice}`;

  return (
    <div
      ref={ref}
      className={`reveal relative rounded border p-8 flex flex-col hover-lift ${
        plan.featured
          ? "border-primary/50 glass glow scale-105 shadow-lg-brand"
          : "border-border/50 glass hover:border-primary/30 hover:glow"
      }`}
    >
      {plan.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mb-5">
        <span className="text-4xl font-bold">{price}</span>
        {plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
          <span className="text-muted-foreground text-sm ml-1">
            {annual ? "/user/mo billed annually" : plan.period}
          </span>
        )}
        {annual && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
          <div className="mt-1 text-xs text-primary font-medium">Save 20% vs monthly</div>
        )}
      </div>

      <ul className="mb-8 space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-center gap-2 text-sm">
            {f.included
              ? <Check className="h-4 w-4 text-primary flex-shrink-0" />
              : <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
            }
            <span className={f.included ? "text-muted-foreground" : "text-muted-foreground/40"}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <Link to={plan.ctaLink}>
        <Button
          variant={plan.featured ? "hero" : "heroOutline"}
          className="w-full"
        >
          {plan.cta}
        </Button>
      </Link>
    </div>
  );
};

const Pricing = () => {
  const [annual, setAnnual] = useState(false);
  const headingRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="pricing" className="relative py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div ref={headingRef} className="reveal mx-auto max-w-2xl text-center mb-10 accent-line-center">
          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl mb-4 uppercase">
            Simple, <span className="text-gradient">per-seat pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            7-day free trial on every paid plan. No credit card required.
          </p>
        </div>

        {/* Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setAnnual((a) => !a)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${annual ? "bg-primary" : "bg-muted"}`}
            aria-label="Toggle annual billing"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${annual ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-sm ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual
            <span className="ml-1.5 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 font-medium">Save 20%</span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} annual={annual} />
          ))}
        </div>

        {/* Pricing FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h3 className="text-center text-lg font-semibold mb-8 text-muted-foreground uppercase tracking-wider text-sm">Pricing FAQ</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {PRICING_FAQS.map(({ q, a }, i) => (
              <AccordionItem
                key={i}
                value={`pfaq-${i}`}
                className="rounded border border-border/50 card-gradient px-5 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-sm font-semibold text-left hover:no-underline py-4">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
