import type { Metadata } from "next";

export const metadata: Metadata = { title: "Returns & Refunds" };

export default function ReturnsPage() {
  return (
    <article className="flex flex-col gap-4 text-sm leading-relaxed">
      <h1 className="font-heading text-3xl font-bold">Returns &amp; Refunds</h1>
      <p className="text-muted-foreground">Last updated: 2026-05-07</p>

      <h2 className="mt-4 font-heading text-xl font-semibold">Eligibility</h2>
      <p>
        You may return most items within <strong>7 calendar days</strong> of
        delivery if they are unused, in original packaging, and accompanied by
        proof of purchase. Some categories — perishables, intimate apparel,
        digital goods, and customised products — are not eligible for return
        unless they arrive damaged.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">How to start a return</h2>
      <ol className="list-decimal pl-5">
        <li>Sign in and open the order from your Account &gt; Orders.</li>
        <li>
          Click <em>Request return</em> and pick a reason (defective, wrong
          item, no longer needed, etc.).
        </li>
        <li>
          The Vendor or our team will respond within 2 business days with
          collection details.
        </li>
      </ol>

      <h2 className="mt-4 font-heading text-xl font-semibold">Refunds</h2>
      <p>
        Once the returned item is received and inspected, we will issue a
        refund within 5 business days:
      </p>
      <ul className="list-disc pl-5">
        <li>M-Pesa: refunded to the same M-Pesa number used at checkout.</li>
        <li>Card: refunded to the original card via Stripe / Paystack (up to 7 days).</li>
        <li>
          Cash on delivery: refunded by M-Pesa to the phone number on the
          order.
        </li>
      </ul>

      <h2 className="mt-4 font-heading text-xl font-semibold">Damaged or wrong items</h2>
      <p>
        If your order arrives damaged or doesn&apos;t match the description,
        contact <a href="mailto:support@safaricart.co.ke">support@safaricart.co.ke</a>{" "}
        within 48 hours of delivery with photos. We&apos;ll arrange a free
        return and a replacement or refund.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">Cancellations</h2>
      <p>
        You can cancel an order before it has shipped from your Account &gt;
        Orders. Once shipped, the standard returns process applies.
      </p>
    </article>
  );
}
