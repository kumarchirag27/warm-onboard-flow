import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const faqs = [
  {
    q: "Does AI Shield read my messages or browsing history?",
    a: "No. AI Shield only scans clipboard content at the exact moment you paste into an AI tool text field. It does not monitor keystrokes, read messages, access your browsing history, or send any content to our servers. All scanning happens locally in your browser.",
  },
  {
    q: "Which AI tools does it protect against?",
    a: "AI Shield works on any web-based AI assistant — ChatGPT, Claude, Gemini, Perplexity, Mistral, Copilot, and more. As AI tools evolve, coverage is updated automatically. Enterprise plans include custom site coverage.",
  },
  {
    q: "Is it Chrome only?",
    a: "Currently yes — Chrome and Chromium-based browsers (Edge, Brave, Arc). Firefox and Safari support is on the roadmap. The extension can be deployed org-wide via Chrome Web Store or MDM (Google Admin, Intune).",
  },
  {
    q: "Can admins see what employees are typing?",
    a: "Admins see the type of data that was blocked (e.g. \"API Key\", \"Credit Card\"), the AI tool it was pasted into, the timestamp, and the user — but never the actual content. The sensitive text is never transmitted off the device.",
  },
  {
    q: "Can I self-host AI Shield?",
    a: "The browser extension runs entirely client-side — there's nothing to self-host. The admin dashboard and policy management are cloud-hosted on our infrastructure (Vercel + Supabase). Enterprise customers can discuss private deployment options.",
  },
];

const FAQ = () => {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section id="faq" className="relative py-24 lg:py-32 border-t border-border/40">
      <div className="container mx-auto px-6">
        <div ref={ref} className="reveal mx-auto max-w-2xl text-center mb-16 accent-line-center">
          <h2 className="text-3xl font-bold tracking-wide sm:text-4xl mb-4 uppercase">
            Common <span className="text-gradient">questions</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Privacy and security are the first things people ask about. Good.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map(({ q, a }, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
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

export default FAQ;
