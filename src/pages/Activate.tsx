import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Download, Copy, Check } from "lucide-react";

// ── Chrome Web Store Extension ID ─────────────────────────────
// Replace this with the real ID after CWS submission.
// Found at: chrome://extensions → Details → ID
const CWS_EXTENSION_ID = "REPLACE_WITH_CWS_EXTENSION_ID";

type ActivateState =
  | "loading"
  | "activated"          // auto-activated via externally_connectable
  | "not_installed"      // extension not detected
  | "already_active"     // was already Pro
  | "invalid_key"        // key missing / malformed
  | "error";             // network / unexpected error

export default function Activate() {
  const [params] = useSearchParams();
  const key = params.get("key") || "";

  const [state, setState] = useState<ActivateState>("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!key || !key.startsWith("ss_ind_")) {
      setState("invalid_key");
      return;
    }

    // Give the browser a tick to ensure chrome.runtime is available
    const timer = setTimeout(() => {
      attemptAutoActivate(key);
    }, 300);

    return () => clearTimeout(timer);
  }, [key]);

  function attemptAutoActivate(licenseKey: string) {
    const cr = (window as any).chrome?.runtime;
    if (!cr) {
      // Extension not installed or not Chrome
      setState("not_installed");
      return;
    }

    try {
      cr.sendMessage(
        CWS_EXTENSION_ID,
        { action: "activateLicense", key: licenseKey },
        (response: { ok: boolean; reason?: string } | undefined) => {
          if ((window as any).chrome.runtime.lastError || !response) {
            // Extension not installed / old version without externally_connectable
            setState("not_installed");
            return;
          }
          if (response.ok) {
            setState("activated");
          } else if (response.reason === "already_active") {
            setState("already_active");
          } else {
            setState("error");
          }
        }
      );
    } catch {
      setState("not_installed");
    }
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const CWSLink = "https://chromewebstore.google.com/detail/secureai-dlp-by-sentrashield/" + CWS_EXTENSION_ID;

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-white font-bold text-lg tracking-tight">SentraShield</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6c5ce7]/10 text-[#6c5ce7] border border-[#6c5ce7]/20 uppercase tracking-widest">AI DLP</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0c1422] border border-[#1c2d45] rounded-2xl overflow-hidden">

          {/* Loading */}
          {state === "loading" && (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#7e67fe]/10 border border-[#7e67fe]/20 flex items-center justify-center mx-auto mb-5 animate-pulse">
                <ShieldCheck className="w-6 h-6 text-[#7e67fe]" />
              </div>
              <p className="text-[#48607f] text-sm">Activating your Pro license…</p>
            </div>
          )}

          {/* Activated */}
          {(state === "activated" || state === "already_active") && (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 flex items-center justify-center mx-auto mb-5">
                <ShieldCheck className="w-7 h-7 text-[#6c5ce7]" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                {state === "already_active" ? "Already Active!" : "Pro Activated!"}
              </h1>
              <p className="text-[#48607f] text-sm leading-relaxed mb-6">
                SentraShield Personal Pro is now active in your browser.
                All 25 detection rules and hard-block mode are enabled.
              </p>
              <div className="bg-[#6c5ce7]/5 border border-[#6c5ce7]/15 rounded-xl px-4 py-3 text-[11px] text-[#c4b5fd] text-center">
                Click the SentraShield extension icon to see your Pro badge
              </div>
            </div>
          )}

          {/* Not installed */}
          {state === "not_installed" && (
            <div className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center mx-auto mb-5">
                <Download className="w-6 h-6 text-[#f59e0b]" />
              </div>
              <h1 className="text-lg font-bold text-white mb-2 text-center">Install the Extension First</h1>
              <p className="text-[#48607f] text-sm leading-relaxed mb-6 text-center">
                The SentraShield extension wasn't detected. Install it, then click the button below to activate.
              </p>

              <a
                href={CWSLink}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center py-3 rounded-xl bg-[#7e67fe] text-[#080c14] font-semibold text-sm mb-4 hover:opacity-90 transition-opacity"
              >
                Install from Chrome Web Store →
              </a>

              <p className="text-[#48607f] text-xs text-center mb-4">
                After installing, click below to auto-activate:
              </p>
              <button
                onClick={() => { setState("loading"); setTimeout(() => attemptAutoActivate(key), 500); }}
                className="block w-full text-center py-2.5 rounded-xl border border-[#1c2d45] text-[#94b4d8] text-sm hover:border-[#7e67fe]/40 transition-colors"
              >
                Try Again
              </button>

              {/* Manual fallback */}
              {key && (
                <div className="mt-6 pt-5 border-t border-[#1c2d45]">
                  <p className="text-[#48607f] text-xs text-center mb-3">
                    Or enter your key manually in the extension popup:
                  </p>
                  <div className="flex items-center gap-2 bg-[#111827] border border-[#1c2d45] rounded-lg px-3 py-2">
                    <span className="font-mono text-xs text-[#dde9f8] flex-1 truncate">{key}</span>
                    <button onClick={copyKey} className="flex-shrink-0 text-[#48607f] hover:text-[#7e67fe] transition-colors">
                      {copied ? <Check className="w-4 h-4 text-[#6c5ce7]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invalid key */}
          {state === "invalid_key" && (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <h1 className="text-lg font-bold text-white mb-2">Invalid Link</h1>
              <p className="text-[#48607f] text-sm leading-relaxed mb-6">
                This activation link is missing a valid license key. Please use the link from your welcome email.
              </p>
              <a href="mailto:support@sentrashield.com" className="text-[#7e67fe] text-sm hover:underline">
                Contact support →
              </a>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <h1 className="text-lg font-bold text-white mb-2">Activation Failed</h1>
              <p className="text-[#48607f] text-sm leading-relaxed mb-4">
                Your license key couldn't be validated. It may be expired or already used on another browser.
              </p>
              {key && (
                <div className="flex items-center gap-2 bg-[#111827] border border-[#1c2d45] rounded-lg px-3 py-2 mb-5">
                  <span className="font-mono text-xs text-[#dde9f8] flex-1 truncate">{key}</span>
                  <button onClick={copyKey} className="flex-shrink-0 text-[#48607f] hover:text-[#7e67fe] transition-colors">
                    {copied ? <Check className="w-4 h-4 text-[#6c5ce7]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
              <a href="mailto:support@sentrashield.com" className="text-[#7e67fe] text-sm hover:underline">
                Contact support →
              </a>
            </div>
          )}

        </div>

        <p className="text-center text-[#2e4060] text-xs mt-6">
          SentraShield Personal Pro · AI Data Loss Prevention
        </p>
      </div>
    </div>
  );
}
