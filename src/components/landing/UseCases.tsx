import { Code2, Users, Banknote } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { type LucideIcon } from "lucide-react";

interface UseCaseCardProps {
  icon: LucideIcon;
  role: string;
  title: string;
  scenario: string;
  before: string;
  after: string;
  delay: number;
}

const UseCaseCard = ({ icon: Icon, role, title, scenario, before, after, delay }: UseCaseCardProps) => {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}s` }}
      className="reveal rounded border border-border/50 card-gradient p-6 flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-xs font-mono text-muted-foreground tracking-wider uppercase">{role}</div>
          <div className="font-semibold text-sm">{title}</div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{scenario}</p>

      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded border border-border/50 bg-muted/30 px-3 py-2 text-xs font-mono">
          <span className="text-muted-foreground/60 mt-px shrink-0">Before</span>
          <span className="text-yellow-400 break-all">{before}</span>
        </div>
        <div className="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-mono">
          <span className="text-muted-foreground/60 mt-px shrink-0">After</span>
          <span className="text-destructive font-semibold">{after}</span>
        </div>
      </div>
    </div>
  );
};

const cases = [
  {
    icon: Code2,
    role: "Developer",
    title: "Pasting API keys into ChatGPT",
    scenario: "Developer pastes an OpenAI or GitHub token while asking for debugging help. The key would be logged in OpenAI's servers.",
    before: "sk-proj-AbC1d2E3fGhIjKlMnOpQrSt...",
    after: "🛑 BLOCKED — OPENAI_KEY_PATTERN",
  },
  {
    icon: Users,
    role: "HR Manager",
    title: "Sharing employee data with AI",
    scenario: "HR drafts a document using Claude and accidentally includes employee national ID numbers or payroll data in the prompt.",
    before: "784-1990-1234567-1 (National ID)",
    after: "🛑 BLOCKED — UAE_NATIONAL_ID",
  },
  {
    icon: Banknote,
    role: "Finance",
    title: "Copying bank account details",
    scenario: "Finance team member pastes IBAN or bank credentials while asking an AI tool to help format a payment summary.",
    before: "AE070331234567890123456",
    after: "🛑 BLOCKED — IBAN_PATTERN",
  },
];

const UseCases = () => {
  const headingRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative py-24 lg:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div ref={headingRef} className="reveal mx-auto max-w-2xl text-center mb-16 accent-line-center">
          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl mb-4 uppercase">
            The leaks <span className="text-gradient">you don't see coming</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Your team doesn't intend to leak data — but it happens. AI Shield catches it before it does.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {cases.map((c, i) => (
            <UseCaseCard key={c.role} {...c} delay={i * 0.12} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
