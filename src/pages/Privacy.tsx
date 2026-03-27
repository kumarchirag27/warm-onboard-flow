const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-16 max-w-3xl">

        {/* Header */}
        <div className="mb-12">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
            ← Back to SentraShield
          </a>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground">Effective date: March 27, 2026 · Last updated: March 27, 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-10 text-sm leading-7 text-muted-foreground">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Overview</h2>
            <p>
              SentraShield ("we", "us", "our") operates the SecureAI DLP Chrome extension and the
              SentraShield platform at <strong className="text-foreground">ai-dlp.sentrashield.com</strong>.
              This policy explains what data we collect, why we collect it, and how it is handled.
              We are committed to processing only the minimum data required to deliver our Data Loss
              Prevention (DLP) service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Data We Collect</h2>
            <div className="space-y-4">
              <div className="border border-border/50 rounded-lg p-4 bg-card/30">
                <p className="font-medium text-foreground mb-1">Violation Events</p>
                <p>
                  When the extension detects sensitive data (e.g. credit card numbers, SSNs, API keys)
                  in content a user is about to paste or send to an AI tool, it logs a violation event.
                  This record includes: the type of sensitive data detected (e.g. "Credit Card Number"),
                  the severity level, the action taken (blocked / masked / allowed), the URL of the
                  monitored site, and a timestamp. <strong className="text-foreground">The raw sensitive
                  text itself is never stored.</strong>
                </p>
              </div>
              <div className="border border-border/50 rounded-lg p-4 bg-card/30">
                <p className="font-medium text-foreground mb-1">User Identifier</p>
                <p>
                  To attribute violations to the correct employee, the extension reads the Google account
                  email address associated with the Chrome profile (via the Chrome Identity API). This
                  email is stored with the violation record so organisation administrators can identify
                  which user triggered the event. If no Google account is signed in, a random anonymous
                  device identifier is used instead.
                </p>
              </div>
              <div className="border border-border/50 rounded-lg p-4 bg-card/30">
                <p className="font-medium text-foreground mb-1">IP Address</p>
                <p>
                  The device's public IP address is collected at violation time for network-level
                  reporting. It is stored with the violation record and accessible only to your
                  organisation administrator.
                </p>
              </div>
              <div className="border border-border/50 rounded-lg p-4 bg-card/30">
                <p className="font-medium text-foreground mb-1">Organisation Account Data</p>
                <p>
                  When an organisation registers, we store the administrator's name, work email address,
                  company name, and subscription status. Enterprise plan billing is handled via bank
                  transfer — no payment card details are stored by SentraShield for enterprise accounts.
                </p>
              </div>
              <div className="border border-border/50 rounded-lg p-4 bg-card/30">
                <p className="font-medium text-foreground mb-1">Individual Pro Account Data</p>
                <p>
                  When an individual subscribes to SentraShield Personal Pro, we store the email address
                  provided at checkout, a generated license key, and the subscription status. Payment is
                  processed by Stripe — SentraShield does not store card numbers or billing details.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Data</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To deliver DLP protection — detecting and blocking sensitive data before it reaches AI services.</li>
              <li>To provide violation dashboards to authorised organisation administrators.</li>
              <li>To send violation alert digest emails to administrators.</li>
              <li>To manage trial periods, subscription status, and licence enforcement.</li>
              <li>To respond to administrator approval requests triggered by end users.</li>
            </ul>
            <p className="mt-4">
              We do not use any collected data for advertising, profiling, or sale to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Who Can See Your Data</h2>
            <p>
              Violation records are scoped to your organisation. Only the administrator(s) of your
              organisation can access violation logs via the dashboard at
              <strong className="text-foreground"> {"{slug}"}.ai-dlp.sentrashield.com</strong>.
              SentraShield staff have infrastructure-level access for support and maintenance purposes
              and operate under strict confidentiality obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Retention</h2>
            <p>
              Violation records are retained for <strong className="text-foreground">90 days</strong> by
              default. Organisation account data is retained for the duration of the subscription plus
              30 days after cancellation, after which it is permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Third-Party Services</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="font-medium text-foreground w-24 shrink-0">Supabase</span>
                <span>Database and backend-as-a-service. Violation records and organisation data are stored in Supabase. Data is hosted in the EU (Frankfurt) region. <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noreferrer">Privacy Policy</a></span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium text-foreground w-24 shrink-0">Vercel</span>
                <span>Serverless hosting for the SentraShield platform. <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noreferrer">Privacy Policy</a></span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium text-foreground w-24 shrink-0">Resend</span>
                <span>Transactional email provider used for trial warnings, violation alerts, approval notifications, and Individual Pro license key delivery. <a href="https://resend.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noreferrer">Privacy Policy</a></span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium text-foreground w-24 shrink-0">Stripe</span>
                <span>Payment processor for Individual Pro subscriptions. Stripe handles all card data — SentraShield never receives or stores payment details. <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noreferrer">Privacy Policy</a></span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Chrome Extension Permissions</h2>
            <div className="space-y-3">
              {[
                { perm: "storage", reason: "Stores organisation API key, detection rules, and monitored site list locally on the device." },
                { perm: "activeTab / tabs", reason: "Sends detection rule updates to open tabs when the admin changes policy; used to identify the current site for monitoring scope." },
                { perm: "identity", reason: "Reads the Chrome profile's Google account email to automatically identify the end user in violation records — no manual input required." },
                { perm: "notifications", reason: "Shows a system notification when an admin-approved paste request is ready." },
                { perm: "alarms", reason: "Triggers periodic background syncs (detection rules, monitored sites, licence check) every 60 minutes." },
                { perm: "host_permissions: <all_urls>", reason: "The extension must run on any website where an AI tool could be opened. The monitored site list is filtered client-side; the extension is fully dormant on unmonitored sites." },
              ].map(({ perm, reason }) => (
                <div key={perm} className="flex gap-3">
                  <code className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded h-fit shrink-0 mt-0.5">{perm}</code>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Your Rights</h2>
            <p>
              End users may contact their organisation administrator to request access to, correction of,
              or deletion of their violation records. Organisation administrators may request full account
              deletion by emailing us at the address below. Upon verified request, all associated data
              will be purged within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated to
              registered organisation administrators via email at least 14 days before they take effect.
              Continued use after that date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us at:<br />
              <a href="mailto:privacy@sentrashield.com" className="text-primary hover:underline">
                privacy@sentrashield.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Privacy;
