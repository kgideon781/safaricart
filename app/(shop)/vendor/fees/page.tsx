import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fees & commission",
  description: "How SafariCart's vendor fees work — flat commission, no listing fees, no monthly charges.",
};

export default function VendorFeesPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight">
        Fees &amp; commission
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Selling on SafariCart is free until you make a sale.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card label="Listing fee" value="KES 0" sub="No charge to list" />
        <Card label="Monthly fee" value="KES 0" sub="No subscriptions" />
        <Card label="Commission" value="10%" sub="Of item subtotal, default" />
      </div>

      <div className="mt-10 flex flex-col gap-8 text-base leading-relaxed">
        <section>
          <h2 className="font-heading text-2xl font-semibold">How commission works</h2>
          <p className="mt-3">
            Commission is calculated on the <strong>item subtotal</strong> (the
            price the customer pays for your products, excluding delivery and
            taxes). For a sale of KES 1,000 at 10% commission, you receive KES
            900 to your payable balance.
          </p>
          <p className="mt-3">
            Commission is recorded in your ledger as a separate line so you can
            always reconcile what was earned vs. what was deducted.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">Payment processing fees</h2>
          <p className="mt-3">
            Payment processors (M-Pesa, card networks) charge their own fees.
            SafariCart absorbs these on your behalf as part of the platform
            commission — you don&apos;t see a separate line for them.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">Refunds & chargebacks</h2>
          <p className="mt-3">
            If a customer is refunded, the corresponding commission is reversed
            in your ledger. Chargebacks (rare on M-Pesa, possible on cards) are
            handled the same way.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">Custom commission rates</h2>
          <p className="mt-3">
            Strategic categories — heavy goods, low-margin staples, or large
            wholesale partners — sometimes have custom rates. If you think
            yours should be one of them, write to{" "}
            <a
              href="mailto:vendors@safaricart.co.ke"
              className="text-primary underline-offset-2 hover:underline"
            >
              vendors@safaricart.co.ke
            </a>{" "}
            with your numbers.
          </p>
        </section>
      </div>
    </article>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-heading text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
