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
    <div className="min-h-screen bg-background text-foreground" style={{ background: "#080c14" }}>

      {/* ── Nav ── */}
      <nav style={{ borderBottom: "1px solid #1c2d45", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logo.png" alt="SentraShield" style={{ height: 28, width: "auto" }} />
        </a>
        <a href="/" style={{ fontSize: 13, color: "#48607f", textDecoration: "none" }}>
          Enterprise →
        </a>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── Success banner ── */}
        {activated && (
          <div style={{
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 12, padding: "16px 20px", marginBottom: 40,
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <Check size={18} style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#f0fff4", fontSize: 14 }}>Payment confirmed — check your email</p>
              <p style={{ margin: "4px 0 0", color: "#6ee7b7", fontSize: 13 }}>
                Your license key is on its way. Open the SentraShield extension and click "Activate Pro →" to paste it in.
              </p>
            </div>
          </div>
        )}

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)",
            borderRadius: 20, padding: "4px 14px", marginBottom: 20,
            fontSize: 11, fontWeight: 700, color: "#2dd4bf", letterSpacing: "0.6px", textTransform: "uppercase",
          }}>
            <Shield size={11} /> Personal Protection
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#f0f6ff", lineHeight: 1.2, marginBottom: 16 }}>
            Stop leaking your data<br />into AI tools
          </h1>
          <p style={{ fontSize: 16, color: "#6b7a8d", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            SentraShield silently watches every prompt you send to ChatGPT, Claude, and Gemini —
            and blocks passwords, API keys, and personal data before they leave your machine.
          </p>
        </div>

        {/* ── Free vs Pro table ── */}
        <div style={{
          border: "1px solid #1c2d45", borderRadius: 12, overflow: "hidden", marginBottom: 48,
        }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            background: "#0c1422", borderBottom: "1px solid #1c2d45",
          }}>
            <div style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#48607f", textTransform: "uppercase", letterSpacing: "0.6px" }}>Feature</div>
            <div style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#5eead4", textTransform: "uppercase", letterSpacing: "0.6px", textAlign: "center", borderLeft: "1px solid #1c2d45" }}>Free</div>
            <div style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.6px", textAlign: "center", borderLeft: "1px solid #1c2d45" }}>Pro $4/mo</div>
          </div>

          {[
            ["Detection rules",    "10 built-in",        "All 25 rules"],
            ["Credit cards, SSNs", <Check size={14} style={{ color: "#1ec890" }} />, <Check size={14} style={{ color: "#1ec890" }} />],
            ["API keys & tokens",  <Check size={14} style={{ color: "#1ec890" }} />, <Check size={14} style={{ color: "#1ec890" }} />],
            ["Block mode",         "Warn only",           "Hard block"],
            ["Custom patterns",    "—",                   "Coming soon"],
            ["No dashboard needed", <Check size={14} style={{ color: "#1ec890" }} />, <Check size={14} style={{ color: "#1ec890" }} />],
            ["Works offline",      <Check size={14} style={{ color: "#1ec890" }} />, <Check size={14} style={{ color: "#1ec890" }} />],
            ["No data to servers", <Check size={14} style={{ color: "#1ec890" }} />, <Check size={14} style={{ color: "#1ec890" }} />],
          ].map(([feature, free, pro], i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              borderBottom: i < 7 ? "1px solid #1c2d45" : "none",
              background: i % 2 === 0 ? "#080c14" : "#0a0e18",
            }}>
              <div style={{ padding: "11px 16px", fontSize: 13, color: "#94b4d8" }}>{feature}</div>
              <div style={{ padding: "11px 16px", fontSize: 13, color: "#48607f", textAlign: "center", borderLeft: "1px solid #1c2d45", display: "flex", alignItems: "center", justifyContent: "center" }}>{free}</div>
              <div style={{ padding: "11px 16px", fontSize: 13, color: "#6ee7b7", textAlign: "center", borderLeft: "1px solid #1c2d45", display: "flex", alignItems: "center", justifyContent: "center" }}>{pro}</div>
            </div>
          ))}
        </div>

        {/* ── How it protects you ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
          {[
            { icon: <Lock size={18} style={{ color: "#2dd4bf" }} />, title: "Runs locally", body: "Detection happens in your browser. No text is sent to SentraShield — ever." },
            { icon: <Eye size={18} style={{ color: "#2dd4bf" }} />, title: "Invisible by design", body: "Silently active on every AI tool. You only see it when it stops a leak." },
            { icon: <Zap size={18} style={{ color: "#2dd4bf" }} />, title: "Zero setup", body: "Install, optionally activate Pro with your key, and protection is immediate." },
            { icon: <Shield size={18} style={{ color: "#2dd4bf" }} />, title: "25 detection rules", body: "Credit cards, SSNs, AWS keys, GitHub tokens, OpenAI keys, Stripe, and more." },
          ].map(({ icon, title, body }, i) => (
            <div key={i} style={{ background: "#0c1422", border: "1px solid #1c2d45", borderRadius: 10, padding: "16px" }}>
              <div style={{ marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#dde9f8", marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#48607f", lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div style={{
          background: "linear-gradient(135deg, #0a1a1a, #0c1422)",
          border: "1px solid rgba(45,212,191,0.2)", borderRadius: 16, padding: "32px",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0f6ff", marginBottom: 6 }}>
            Get SentraShield Pro
          </h2>
          <p style={{ fontSize: 14, color: "#48607f", marginBottom: 24 }}>
            $4/month · Cancel anytime · License key delivered by email
          </p>

          <form onSubmit={handleCheckout} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                flex: 1, minWidth: 200,
                background: "#111827", border: "1px solid #1c2d45",
                borderRadius: 8, padding: "11px 14px",
                color: "#dde9f8", fontSize: 13, outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#2dd4bf", color: "#080c14",
                border: "none", borderRadius: 8,
                padding: "11px 24px", fontSize: 13, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1, whiteSpace: "nowrap",
              }}
            >
              {loading ? "Redirecting…" : "Get Pro →"}
            </button>
          </form>

          {error && (
            <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>{error}</p>
          )}

          <p style={{ fontSize: 11, color: "#2e4060", marginTop: 14 }}>
            Secure checkout via Stripe · No card stored with SentraShield · Subscription billed monthly
          </p>
        </div>

        {/* ── Free install note ── */}
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#48607f" }}>
            Just want the free version?{" "}
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#2dd4bf", textDecoration: "none" }}
            >
              Install from Chrome Web Store
            </a>
            {" "}— 10 rules, warn mode, no account needed.
          </p>
        </div>

      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid #1c2d45", padding: "20px 24px",
        display: "flex", justifyContent: "center", gap: 24,
        fontSize: 12, color: "#2e4060",
      }}>
        <a href="/privacy" style={{ color: "#2e4060", textDecoration: "none" }}>Privacy</a>
        <a href="mailto:support@sentrashield.com" style={{ color: "#2e4060", textDecoration: "none" }}>Support</a>
        <a href="/" style={{ color: "#2e4060", textDecoration: "none" }}>Enterprise</a>
        <span>© 2026 SentraShield</span>
      </div>
    </div>
  );
};

export default Personal;
