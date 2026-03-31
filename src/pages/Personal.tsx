import { useState, useEffect } from "react";
import { Check, Shield, Zap, Lock, Eye } from "lucide-react";

const Personal = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const activated = new URLSearchParams(window.location.search).get("activated") === "1";

  useEffect(() => {
    document.title = "SentraShield Personal — Protect yourself from AI data leaks";
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-foreground">

      {/* Nav */}
      <nav className="border-b border-[#1c2d45] px-6 py-3.5 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src="/logo.png" alt="SentraShield" className="h-7 w-auto" />
        </a>
        <a href="/" className="text-xs text-[#48607f] hover:text-[#94b4d8] transition-colors">
          Enterprise →
        </a>
      </nav>

      <div className="max-w-[680px] mx-auto px-6 py-12 pb-20">

        {/* Success banner */}
        {activated && (
          <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-xl p-4 mb-10 flex gap-3 items-start">
            <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="m-0 font-bold text-[#f0fff4] text-sm">Payment confirmed — check your email</p>
              <p className="mt-1 text-emerald-300 text-xs leading-relaxed">
                Your license key is on its way. Open the SentraShield extension and click "Activate Pro →" to paste it in.
              </p>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 bg-teal-400/8 border border-teal-400/20 rounded-full px-3.5 py-1 mb-5 text-[11px] font-bold text-teal-400 tracking-[0.6px] uppercase">
            <Shield size={11} /> Personal Protection
          </div>
          <h1 className="text-4xl font-extrabold text-[#f0f6ff] leading-tight mb-4">
            Stop leaking your data<br />into AI tools
          </h1>
          <p className="text-base text-[#6b7a8d] leading-[1.7] max-w-[480px] mx-auto">
            SentraShield silently watches every prompt you send to ChatGPT, Claude, and Gemini —
            and blocks passwords, API keys, and personal data before they leave your machine.
          </p>
        </div>

        {/* Free vs Pro table */}
        <div className="border border-[#1c2d45] rounded-xl overflow-hidden mb-12">
          <div className="grid grid-cols-3 bg-[#0c1422] border-b border-[#1c2d45]">
            <div className="p-3 px-4 text-xs font-bold text-[#48607f] uppercase tracking-[0.6px]">Feature</div>
            <div className="p-3 px-4 text-xs font-bold text-teal-300 uppercase tracking-[0.6px] text-center border-l border-[#1c2d45]">Free</div>
            <div className="p-3 px-4 text-xs font-bold text-emerald-500 uppercase tracking-[0.6px] text-center border-l border-[#1c2d45]">Pro $4/mo</div>
          </div>

          {([
            ["Detection rules",     "10 built-in",        "All 25 rules"],
            ["Credit cards, SSNs",  <Check size={14} className="text-[#1ec890]" />, <Check size={14} className="text-[#1ec890]" />],
            ["API keys & tokens",   <Check size={14} className="text-[#1ec890]" />, <Check size={14} className="text-[#1ec890]" />],
            ["Block mode",          "Warn only",           "Hard block"],
            ["Custom patterns",     "—",                   "Coming soon"],
            ["No dashboard needed", <Check size={14} className="text-[#1ec890]" />, <Check size={14} className="text-[#1ec890]" />],
            ["Works offline",       <Check size={14} className="text-[#1ec890]" />, <Check size={14} className="text-[#1ec890]" />],
            ["No data to servers",  <Check size={14} className="text-[#1ec890]" />, <Check size={14} className="text-[#1ec890]" />],
          ] as [React.ReactNode, React.ReactNode, React.ReactNode][]).map(([feature, free, pro], i) => (
            <div
              key={i}
              className={`grid grid-cols-3 ${i < 7 ? "border-b border-[#1c2d45]" : ""} ${i % 2 === 0 ? "bg-[#080c14]" : "bg-[#0a0e18]"}`}
            >
              <div className="py-2.5 px-4 text-sm text-[#94b4d8]">{feature}</div>
              <div className="py-2.5 px-4 text-sm text-[#48607f] text-center border-l border-[#1c2d45] flex items-center justify-center">{free}</div>
              <div className="py-2.5 px-4 text-sm text-emerald-300 text-center border-l border-[#1c2d45] flex items-center justify-center">{pro}</div>
            </div>
          ))}
        </div>

        {/* How it protects you */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          {[
            { icon: <Lock size={18} className="text-teal-400" />, title: "Runs locally", body: "Detection happens in your browser. No text is sent to SentraShield — ever." },
            { icon: <Eye size={18} className="text-teal-400" />, title: "Invisible by design", body: "Silently active on every AI tool. You only see it when it stops a leak." },
            { icon: <Zap size={18} className="text-teal-400" />, title: "Zero setup", body: "Install, optionally activate Pro with your key, and protection is immediate." },
            { icon: <Shield size={18} className="text-teal-400" />, title: "25 detection rules", body: "Credit cards, SSNs, AWS keys, GitHub tokens, OpenAI keys, Stripe, and more." },
          ].map(({ icon, title, body }, i) => (
            <div key={i} className="bg-[#0c1422] border border-[#1c2d45] rounded-xl p-4">
              <div className="mb-2">{icon}</div>
              <div className="text-sm font-bold text-[#dde9f8] mb-1">{title}</div>
              <div className="text-xs text-[#48607f] leading-relaxed">{body}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#0a1a1a] to-[#0c1422] border border-teal-400/20 rounded-2xl p-8">
          <h2 className="text-2xl font-extrabold text-[#f0f6ff] mb-1.5">
            Get SentraShield Pro
          </h2>
          <p className="text-sm text-[#48607f] mb-6">
            $4/month · Cancel anytime · License key delivered by email
          </p>

          <form onSubmit={handleCheckout} className="flex gap-2.5 flex-wrap">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 min-w-[200px] bg-gray-900 border border-[#1c2d45] rounded-lg px-3.5 py-2.5 text-[#dde9f8] text-sm outline-none focus:border-teal-400/50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-teal-400 text-[#080c14] border-none rounded-lg px-6 py-2.5 text-sm font-bold whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed hover:bg-teal-300 transition-colors"
            >
              {loading ? "Redirecting…" : "Get Pro →"}
            </button>
          </form>

          {error && (
            <p className="text-xs text-red-400 mt-2.5">{error}</p>
          )}

          <p className="text-[11px] text-[#2e4060] mt-3.5">
            Secure checkout via Stripe · No card stored with SentraShield · Subscription billed monthly
          </p>
        </div>

        {/* Free install note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#48607f]">
            Just want the free version?{" "}
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noreferrer"
              className="text-teal-400 hover:text-teal-300 transition-colors no-underline"
            >
              Install from Chrome Web Store
            </a>
            {" "}— 10 rules, warn mode, no account needed.
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t border-[#1c2d45] py-5 px-6 flex justify-center gap-6 text-xs text-[#2e4060]">
        <a href="/privacy" className="text-[#2e4060] hover:text-[#48607f] transition-colors no-underline">Privacy</a>
        <a href="mailto:support@sentrashield.com" className="text-[#2e4060] hover:text-[#48607f] transition-colors no-underline">Support</a>
        <a href="/" className="text-[#2e4060] hover:text-[#48607f] transition-colors no-underline">Enterprise</a>
        <span>© 2026 SentraShield</span>
      </div>
    </div>
  );
};

export default Personal;
