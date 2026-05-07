import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Vendor handbook",
  description: "Everything you need to start selling on SafariCart — registration, products, fulfillment, payouts.",
};

export default function VendorLearnPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight">
        Vendor handbook
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        A short guide to selling on SafariCart. From signup to your first
        payout, in five steps.
      </p>

      <div className="mt-10 flex flex-col gap-8 text-base leading-relaxed">
        <section>
          <h2 className="font-heading text-2xl font-semibold">1. Register</h2>
          <p className="mt-3">
            Create your store at{" "}
            <Link href="/vendor/register" className="text-primary underline-offset-2 hover:underline">
              /vendor/register
            </Link>
            . Pick a business name (this becomes your store URL), confirm your
            phone, and tell us which county you operate from. Approval usually
            takes one business day.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">2. Verify your business</h2>
          <p className="mt-3">
            Upload your business permit and ID (or KRA PIN) on the{" "}
            <Link
              href="/vendor/dashboard/settings"
              className="text-primary underline-offset-2 hover:underline"
            >
              settings page
            </Link>
            . Verified vendors get a badge on their store and product cards,
            which converts better.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">3. List products</h2>
          <p className="mt-3">
            Add products from the dashboard. Use clear photos (we recommend at
            least 3 angles), specific titles, accurate stock counts, and
            descriptions written in plain English. Where applicable, include
            both KES and quantity (e.g. &ldquo;500g&rdquo;).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">4. Fulfill orders</h2>
          <p className="mt-3">
            When a customer places an order, you get notified. Mark the order
            as <em>fulfilling</em> when you start packing, and as{" "}
            <em>shipped</em> when the courier picks it up. Customers can rate
            you — fast, accurate fulfillment is the single biggest driver of
            repeat sales.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold">5. Get paid</h2>
          <p className="mt-3">
            Customer payments are held for 7 days after delivery, then released
            to your payable balance. You can request payout to M-Pesa or bank
            from your dashboard. Commission is deducted before payout — see{" "}
            <Link href="/vendor/fees" className="text-primary underline-offset-2 hover:underline">
              fees
            </Link>
            .
          </p>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/vendor/register" className={buttonVariants({ size: "lg" })}>
          Open your store
        </Link>
        <Link
          href="/vendor/fees"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          See fees
        </Link>
      </div>
    </article>
  );
}
