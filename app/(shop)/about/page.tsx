import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About SafariCart",
  description:
    "SafariCart is Kenya's online marketplace — connecting trusted vendors across all 47 counties with shoppers nationwide.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight">
        About SafariCart
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Kenya&apos;s online marketplace — built locally, for the way Kenyans
        actually shop.
      </p>

      <div className="mt-10 flex flex-col gap-6 text-base leading-relaxed">
        <section>
          <h2 className="font-heading text-2xl font-semibold">Why we exist</h2>
          <p className="mt-3">
            For a long time, the easiest way to buy something online in Kenya
            was to import it. We&apos;re changing that. SafariCart connects
            verified Kenyan vendors with shoppers across all 47 counties so
            that buying local is as fast, safe, and convenient as buying from
            anywhere else.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">How we&apos;re different</h2>
          <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
            <li>
              <strong>M-Pesa first.</strong> No card needed. STK push at
              checkout, instant confirmation, refunds back to the same number.
            </li>
            <li>
              <strong>Vetted vendors.</strong> Every seller is reviewed before
              going live. Verified vendors carry a badge.
            </li>
            <li>
              <strong>County-wide delivery.</strong> Our vendor network
              dispatches from across Kenya, not just Nairobi.
            </li>
            <li>
              <strong>Plain pricing.</strong> Prices in KES, no exchange-rate
              surprises, no hidden fees.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">The team</h2>
          <p className="mt-3">
            SafariCart is built by a small team based in Nairobi. We&apos;re
            still early — if something is broken or missing, please tell us.
            We&apos;ll usually fix it the same week.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">Get in touch</h2>
          <p className="mt-3">
            Questions, partnership ideas, or feedback?{" "}
            <a href="/contact" className="text-primary underline-offset-2 hover:underline">
              Drop us a line
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
