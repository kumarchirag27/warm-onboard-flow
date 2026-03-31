import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const rows = [
  { feature: "Real-time paste detection",     personal: true,  team: true  },
  { feature: "Block / Warn / Log policies",   personal: false, team: true  },
  { feature: "Admin dashboard",               personal: false, team: true  },
  { feature: "Team-wide policy rollout",      personal: false, team: true  },
  { feature: "Audit logs & compliance export",personal: false, team: true  },
  { feature: "MDM deployment",                personal: false, team: true  },
  { feature: "Custom data patterns (regex)",  personal: false, team: true  },
  { feature: "Free to use",                   personal: true,  team: false },
];

const CompareSection = () => {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-24 lg:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div ref={ref} className="reveal mx-auto max-w-2xl text-center mb-16 accent-line-center">
          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl mb-4 uppercase">
            Personal or <span className="text-gradient">enterprise?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Use it free for yourself, or deploy it across your entire organisation.
          </p>
        </div>

        <div className="max-w-2xl mx-auto rounded border border-border/50 card-gradient overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-border/50 bg-muted/30">
            <div className="px-6 py-4 text-sm text-muted-foreground">Feature</div>
            <div className="px-6 py-4 text-sm font-semibold text-center border-l border-border/50">
              Personal
              <div className="text-xs font-normal text-muted-foreground mt-0.5">Free forever</div>
            </div>
            <div className="px-6 py-4 text-sm font-semibold text-center border-l border-border/50 text-primary">
              Team
              <div className="text-xs font-normal text-muted-foreground mt-0.5">From $4/user/mo</div>
            </div>
          </div>

          {/* Rows */}
          {rows.map(({ feature, personal, team }) => (
            <div key={feature} className="grid grid-cols-3 border-b border-border/30 last:border-0">
              <div className="px-6 py-3.5 text-sm text-muted-foreground">{feature}</div>
              <div className="px-6 py-3.5 flex justify-center items-center border-l border-border/30">
                {personal
                  ? <Check className="w-4 h-4 text-primary" />
                  : <X className="w-4 h-4 text-muted-foreground/30" />}
              </div>
              <div className="px-6 py-3.5 flex justify-center items-center border-l border-border/30">
                {team
                  ? <Check className="w-4 h-4 text-primary" />
                  : <X className="w-4 h-4 text-muted-foreground/30" />}
              </div>
            </div>
          ))}

          {/* CTAs */}
          <div className="grid grid-cols-3 border-t border-border/50 bg-muted/20 p-4 gap-3">
            <div />
            <div className="flex justify-center">
              <Link to="/personal">
                <Button variant="heroOutline" size="sm" className="w-full">
                  Get Personal
                </Button>
              </Link>
            </div>
            <div className="flex justify-center">
              <Link to="/signup">
                <Button variant="hero" size="sm" className="w-full">
                  Start Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompareSection;
