const Billing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-16 max-w-3xl">

        {/* Header */}
        <div className="mb-12">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
            ← Back to SentraShield
          </a>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Billing & Payment</h1>
          <p className="text-muted-foreground">How subscriptions and payments work at SentraShield.</p>
        </div>

        <div className="space-y-10 text-sm leading-7 text-muted-foreground">

          {/* How it works */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">How billing works</h2>
            <p className="mb-4">
              SentraShield uses a simple, no-friction billing model. We don't store card details or
              use automated payment processors. All subscriptions are activated manually after
              payment confirmation — giving you full control.
            </p>
            <ol className="space-y-3 list-none">
              {[
                { step: '1', text: 'Sign up and use your 7-day free trial — no payment required.' },
                { step: '2', text: 'Before your trial ends, email us to confirm your chosen plan and seat count.' },
                { step: '3', text: 'We send you a payment reference and bank transfer details.' },
                { step: '4', text: 'Transfer payment via bank transfer (SEPA, SWIFT, or domestic).' },
                { step: '5', text: 'We confirm receipt and activate your subscription within 1 business day.' },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {step}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Plans */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Plans & pricing</h2>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Plan</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Price</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-3 font-medium text-foreground">Starter</td>
                    <td className="px-4 py-3">$4 / user / month</td>
                    <td className="px-4 py-3">Small teams up to 25 users</td>
                  </tr>
                  <tr className="border-b border-border/30 bg-primary/5">
                    <td className="px-4 py-3 font-medium text-foreground">
                      Business
                      <span className="ml-2 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">Popular</span>
                    </td>
                    <td className="px-4 py-3">$12 / user / month</td>
                    <td className="px-4 py-3">Unlimited users, full dashboard & MDM</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Enterprise</td>
                    <td className="px-4 py-3">Custom</td>
                    <td className="px-4 py-3">Large orgs, SSO, custom integrations</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground/70">
              Billed annually or monthly. Annual plans receive a 20% discount. Minimum 5 seats on Starter, 10 seats on Business.
            </p>
          </section>

          {/* Payment methods */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Accepted payment methods</h2>
            <ul className="space-y-2">
              {[
                'Bank transfer (SEPA — EU/EEA)',
                'International wire transfer (SWIFT)',
                'UK Faster Payments',
                'ACH (US bank transfer)',
              ].map(method => (
                <li key={method} className="flex items-center gap-2">
                  <span className="text-primary">→</span> {method}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We do not accept credit cards at this time. If your organisation requires a different
              payment method, contact us and we'll do our best to accommodate.
            </p>
          </section>

          {/* Invoices */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Invoices & receipts</h2>
            <p>
              A VAT invoice is issued upon payment confirmation and sent to your account's admin
              email address. Invoices include your organisation name, subscription period, seat
              count, and payment reference. If you need invoices addressed differently or require a
              purchase order (PO) number, include this when you email us to confirm your plan.
            </p>
          </section>

          {/* Trial & cancellation */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Trial, renewal & cancellation</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-foreground">Free trial:</strong> 7 days from approval.
                No payment is required to start. Your account is automatically deactivated at the
                end of the trial if no subscription is activated.
              </p>
              <p>
                <strong className="text-foreground">Renewal:</strong> We email a reminder 30 days
                and 7 days before your subscription expires. Renewal requires a new bank transfer —
                there is no automatic charge.
              </p>
              <p>
                <strong className="text-foreground">Cancellation:</strong> No lock-in. Email us at
                any time to cancel. If you cancel mid-period, no refund is issued for the remaining
                days — but your access continues until the period ends.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-lg border border-border/50 bg-muted/10 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Ready to subscribe or have a question?</h2>
            <p className="mb-4">
              Email us at{' '}
              <a href="mailto:billing@sentrashield.com" className="text-primary hover:underline">
                billing@sentrashield.com
              </a>{' '}
              with your organisation name, chosen plan, and number of seats. We'll reply with
              payment details within one business day.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Start your free trial →
            </a>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Billing;
