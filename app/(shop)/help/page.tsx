import type { Metadata } from "next";
import Link from "next/link";
import { Package, RotateCcw, Search, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Help center",
  description: "Find answers to common questions about ordering, delivery, returns, and payments on SafariCart.",
};

const topics = [
  {
    icon: Search,
    title: "Track an order",
    description: "Look up your order with the order number and email.",
    href: "/orders/track",
  },
  {
    icon: Truck,
    title: "Shipping & delivery",
    description: "Delivery times, areas covered, and dispatch policy.",
    href: "/help/shipping",
  },
  {
    icon: RotateCcw,
    title: "Returns & refunds",
    description: "Eligibility, the return process, and refund timelines.",
    href: "/legal/returns",
  },
  {
    icon: Package,
    title: "Become a vendor",
    description: "Open your store on SafariCart in a few minutes.",
    href: "/vendor/register",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight">Help center</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Quick answers to the questions we get most. If you can&apos;t find what
        you&apos;re looking for,{" "}
        <Link href="/contact" className="text-primary underline-offset-2 hover:underline">
          contact us
        </Link>{" "}
        — we usually reply within one business day.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {topics.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group flex gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <t.icon className="size-5" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-heading font-semibold group-hover:text-primary">
                {t.title}
              </span>
              <span className="text-sm text-muted-foreground">{t.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
