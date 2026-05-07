import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press",
  description: "Press kit and media enquiries for SafariCart.",
};

export default function PressPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight">Press</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Writing about Kenyan e-commerce? We&apos;re happy to help.
      </p>

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-semibold">Quick facts</h2>
        <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
          <li>Founded in Nairobi, Kenya.</li>
          <li>Multi-vendor marketplace serving all 47 counties.</li>
          <li>Payments: M-Pesa, Airtel Money, Visa/Mastercard, Cash on Delivery.</li>
          <li>Currency: Kenyan shilling (KES) — no FX surcharges.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-semibold">Press enquiries</h2>
        <p className="mt-3">
          For interviews, quotes, or asset requests, write to{" "}
          <a
            href="mailto:press@safaricart.co.ke"
            className="text-primary underline-offset-2 hover:underline"
          >
            press@safaricart.co.ke
          </a>
          . Please include your outlet, deadline, and angle so we can route the
          request quickly.
        </p>
      </section>
    </article>
  );
}
