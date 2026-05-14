import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & delivery",
  description: "How SafariCart delivers across Kenya — areas, timelines, and dispatch policy.",
};

export default function ShippingPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight">
        Shipping &amp; delivery
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        How orders move from our vendors to your door, anywhere in Kenya.
      </p>

      <div className="mt-10 flex flex-col gap-8 text-base leading-relaxed">
        <section>
          <h2 className="font-heading text-2xl font-semibold">Delivery areas</h2>
          <p className="mt-3">
            We deliver to all 47 counties. Most vendors dispatch from Nairobi,
            Mombasa, Kisumu, Nakuru, or Eldoret, so timelines depend on the
            distance from the vendor to you.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">Estimated timelines</h2>
          <ul className="mt-3 flex flex-col gap-2 list-disc pl-5">
            <li>
              <strong>Within Nairobi metro</strong> — same-day or next-day for in-stock items.
            </li>
            <li>
              <strong>Other major towns</strong> — 1–3 business days.
            </li>
            <li>
              <strong>Remote areas</strong> — 3–5 business days, sometimes longer for upcountry pickups.
            </li>
            <li>
              <strong>Heavy or fragile items</strong> — vendor will contact you to schedule.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">Dispatch & courier</h2>
          <p className="mt-3">
            Vendors are responsible for dispatch. We work with riders, parcel
            services, and matatu courier where appropriate. The courier and
            tracking number (when available) appear in your{" "}
            <Link href="/account/orders" className="text-primary underline-offset-2 hover:underline">
              order history
            </Link>{" "}
            once the vendor marks the order as shipped.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">Delivery fees</h2>
          <p className="mt-3">
            Delivery is calculated at checkout based on your county and the
            vendor&apos;s pickup point. Many vendors offer free delivery within
            Nairobi above a minimum order value — look for the badge on the
            product page.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">Failed deliveries</h2>
          <p className="mt-3">
            If we can&apos;t reach you on the phone number you provided, the
            courier will attempt delivery once more before returning the parcel
            to the vendor. You can rebook from your order page or contact us
            for help.
          </p>
        </section>
      </div>
    </article>
  );
}
