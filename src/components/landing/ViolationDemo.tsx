import { useEffect, useRef, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

type Phase = "typing" | "paused" | "blocked" | "resetting";

const PREFIX = "Can you debug this? My key is: ";
const SECRET = "sk-proj-AbC1d2E3fGhIjKlMnOpQ";
const FULL   = PREFIX + SECRET;

// Patterns used for interactive mode — label + regex
const DEMO_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "OpenAI API Key",     pattern: /sk-proj-[A-Za-z0-9]{10,}/ },
  { label: "AWS Access Key",     pattern: /AKIA[0-9A-Z]{16}/ },
  { label: "GitHub Token",       pattern: /ghp_[A-Za-z0-9]{36}/ },
  { label: "Credit Card",        pattern: /\b(?:\d[ -]?){13,16}\b/ },
  { label: "UAE Mobile Number",  pattern: /\b(?:\+971|00971|0)5[0-9]{8}\b/ },
];

function detectPattern(text: string): string | null {
  for (const { label, pattern } of DEMO_PATTERNS) {
    if (pattern.test(text)) return label;
  }
  return null;
}

const ViolationDemo = () => {
  // ── Auto-play state ──
  const [typed, setTyped]   = useState(0);
  const [phase, setPhase]   = useState<Phase>("typing");

  // ── Interactive state ──
  const [userText, setUserText]     = useState("");
  const [interactive, setInteractive] = useState(false);
  const [detectedLabel, setDetectedLabel] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-play loop (only when not in interactive mode)
  useEffect(() => {
    if (interactive) return;
    let t: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (typed < FULL.length) {
        const delay = typed < PREFIX.length ? 38 : 52;
        t = setTimeout(() => setTyped((n) => n + 1), delay);
      } else {
        t = setTimeout(() => setPhase("paused"), 700);
      }
    } else if (phase === "paused") {
      t = setTimeout(() => setPhase("blocked"), 500);
    } else if (phase === "blocked") {
      t = setTimeout(() => setPhase("resetting"), 3800);
    } else {
      setTyped(0);
      t = setTimeout(() => setPhase("typing"), 600);
    }

    return () => clearTimeout(t);
  }, [phase, typed, interactive]);

  // Interactive handler
  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserText(val);
    setDetectedLabel(detectPattern(val));
  };

  const handleTryItClick = () => {
    setInteractive(true);
    setUserText("");
    setDetectedLabel(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleReset = () => {
    setInteractive(false);
    setUserText("");
    setDetectedLabel(null);
    setTyped(0);
    setPhase("typing");
  };

  // Derived display values for auto-play mode
  const display      = FULL.slice(0, typed);
  const prefixPart   = display.slice(0, PREFIX.length);
  const secretPart   = display.slice(PREFIX.length);
  const isBlocked    = phase === "blocked";

  const interactiveBlocked = interactive && detectedLabel !== null;

  return (
    <div className="rounded border border-border/60 bg-card shadow-2xl overflow-hidden font-mono text-sm select-none">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border/50">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-xs text-muted-foreground flex-1 text-center truncate">
          chat.openai.com/chat
        </span>
        <div className="flex items-center gap-1 text-xs text-primary shrink-0">
          <ShieldAlert className="w-3 h-3" />
          <span>AI Shield</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="p-4 space-y-3 min-h-[230px]">
        {/* AI message */}
        <div className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#6c5ce7] flex-shrink-0 grid place-items-center text-[10px] font-bold text-white">
            G
          </div>
          <div className="bg-muted/40 rounded px-3 py-2 text-xs text-muted-foreground max-w-[85%]">
            Sure! Share the API key and the error message.
          </div>
        </div>

        {/* ── Auto-play mode ── */}
        {!interactive && (
          <div className="flex justify-end">
            <div
              className={`rounded px-3 py-2 text-xs max-w-[90%] border transition-colors duration-300 ${
                isBlocked
                  ? "border-destructive/50 bg-destructive/10"
                  : "border-border/40 bg-muted/20"
              }`}
            >
              <span className="text-muted-foreground">{prefixPart}</span>
              {secretPart.length > 0 && (
                <span className={isBlocked ? "text-destructive" : "text-yellow-400"}>
                  {secretPart}
                </span>
              )}
              {phase === "typing" && (
                <span className="terminal-caret text-primary ml-px">|</span>
              )}
            </div>
          </div>
        )}

        {/* ── Interactive mode ── */}
        {interactive && (
          <div className="flex justify-end">
            <div
              className={`rounded px-3 py-2 text-xs w-full border transition-colors duration-200 ${
                interactiveBlocked
                  ? "border-destructive/50 bg-destructive/10"
                  : userText
                  ? "border-primary/30 bg-muted/20"
                  : "border-border/40 bg-muted/20"
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                value={userText}
                onChange={handleUserInput}
                placeholder="Type or paste something… try: sk-proj-abc123"
                className="bg-transparent outline-none w-full text-xs text-muted-foreground placeholder:text-muted-foreground/40 font-mono"
              />
            </div>
          </div>
        )}

        {/* Block banner — auto-play */}
        {!interactive && isBlocked && (
          <div className="slide-in-bottom flex items-start gap-2.5 rounded border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs">
            <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-destructive uppercase tracking-wider text-[11px] mb-0.5">
                Blocked — API key detected
              </div>
              <div className="text-muted-foreground">Rule: OPENAI_KEY_PATTERN · Severity: CRITICAL</div>
              <div className="text-muted-foreground">Logged to audit trail · User notified</div>
            </div>
          </div>
        )}

        {/* Block banner — interactive */}
        {interactive && interactiveBlocked && (
          <div className="slide-in-bottom flex items-start gap-2.5 rounded border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs">
            <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-destructive uppercase tracking-wider text-[11px] mb-0.5">
                Blocked — {detectedLabel} detected
              </div>
              <div className="text-muted-foreground">Severity: CRITICAL · Logged to audit trail</div>
            </div>
          </div>
        )}

        {/* Safe banner — interactive, non-empty, no match */}
        {interactive && !interactiveBlocked && userText.length > 4 && (
          <div className="flex items-center gap-2 text-xs text-primary/70">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>No sensitive patterns detected</span>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-border/40 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Policy: Block sensitive patterns</span>
        <div className="flex items-center gap-3">
          {!interactive ? (
            <>
              <span className={isBlocked ? "text-destructive font-semibold" : "text-primary"}>
                {isBlocked ? "🛑 1 violation blocked" : "✓ Monitoring active"}
              </span>
              <button
                onClick={handleTryItClick}
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer"
              >
                Try it yourself →
              </button>
            </>
          ) : (
            <>
              <span className={interactiveBlocked ? "text-destructive font-semibold" : "text-primary"}>
                {interactiveBlocked ? "🛑 Blocked" : "✓ Scanning…"}
              </span>
              <button
                onClick={handleReset}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors cursor-pointer"
              >
                ← Watch demo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViolationDemo;
