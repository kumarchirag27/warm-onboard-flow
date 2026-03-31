import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

type Phase = "typing" | "paused" | "blocked" | "resetting";

const PREFIX = "Can you debug this? My key is: ";
const SECRET = "sk-proj-AbC1d2E3fGhIjKlMnOpQrSt...";
const FULL   = PREFIX + SECRET;

const ViolationDemo = () => {
  const [typed, setTyped]   = useState(0);
  const [phase, setPhase]   = useState<Phase>("typing");

  useEffect(() => {
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
  }, [phase, typed]);

  const display   = FULL.slice(0, typed);
  const prefixPart = display.slice(0, PREFIX.length);
  const secretPart = display.slice(PREFIX.length);
  const isBlocked  = phase === "blocked";

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
      <div className="p-4 space-y-3 min-h-[210px]">
        {/* AI message */}
        <div className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-600 flex-shrink-0 grid place-items-center text-[10px] font-bold text-white">
            G
          </div>
          <div className="bg-muted/40 rounded px-3 py-2 text-xs text-muted-foreground max-w-[85%]">
            Sure! Share the API key and the error message.
          </div>
        </div>

        {/* User message (being typed) */}
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

        {/* Block banner */}
        {isBlocked && (
          <div className="slide-in-bottom flex items-start gap-2.5 rounded border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs">
            <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-destructive uppercase tracking-wider text-[11px] mb-0.5">
                Blocked — API key detected
              </div>
              <div className="text-muted-foreground">
                Rule: OPENAI_KEY_PATTERN · Severity: CRITICAL
              </div>
              <div className="text-muted-foreground">
                Logged to audit trail · User notified
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-border/40 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Policy: Block sensitive patterns</span>
        <span className={isBlocked ? "text-destructive font-semibold" : "text-primary"}>
          {isBlocked ? "🛑 1 violation blocked" : "✓ Monitoring active"}
        </span>
      </div>
    </div>
  );
};

export default ViolationDemo;
