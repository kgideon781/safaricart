import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Look up your SafariCart order using the order number and the email it was placed with.",
};

type Params = Promise<{ orderNumber?: string; email?: string }>;

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const { orderNumber, email } = await searchParams;

  const result =
    orderNumber && email
      ? await lookupOrder(orderNumber.trim(), email.trim().toLowerCase())
      : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 md:px-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
        Track an order
      </h1>
      <p className="mt-2 text-muted-foreground">
        Enter the order number from your confirmation email and the email
        address you placed the order with.
      </p>

      <form
        action={async (fd) => {
          "use server";
          const num = String(fd.get("orderNumber") ?? "").trim();
          const em = String(fd.get("email") ?? "").trim();
          if (!num || !em) return;
          redirect(
            `/orders/track?orderNumber=${encodeURIComponent(num)}&email=${encodeURIComponent(em)}`,
          );
        }}
        className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Order number</span>
          <Input
            name="orderNumber"
            defaultValue={orderNumber ?? ""}
            placeholder="SC-202605-00001"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Email</span>
          <Input
            name="email"
            type="email"
            defaultValue={email ?? ""}
            placeholder="you@example.com"
            required
          />
        </label>
        <Button type="submit" className="self-start">
          Track order
        </Button>
      </form>

      {orderNumber && email && (
        <div className="mt-6">
          {result ? (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-heading text-lg font-semibold">
                  {result.orderNumber}
                </span>
                <StatusBadge status={result.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Placed{" "}
                {result.placedAt.toLocaleDateString("en-KE", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{result.itemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{formatKES(result.totalKes)}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Signed in?{" "}
                <Link
                  href={`/account/orders/${result.orderNumber}`}
                  className="text-primary hover:underline"
                >
                  Open full details in your account
                </Link>
                .
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
              No order matches that combination. Double-check the order number
              and the email you used at checkout.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

async function lookupOrder(orderNumber: string, email: string) {
  const order = await db.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      status: true,
      placedAt: true,
      totalKes: true,
      user: { select: { email: true } },
      _count: { select: { items: true } },
    },
  });
  // Constant-time-ish guard against enumeration: only return a hit when both
  // pieces match. Email comparison is case-insensitive.
  if (!order) return null;
  if (order.user.email.toLowerCase() !== email) return null;
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.placedAt,
    totalKes: order.totalKes,
    itemCount: order._count.items,
  };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  FULFILLING: "Being prepared",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "DELIVERED"
      ? "bg-secondary text-secondary-foreground"
      : status === "PAID" || status === "FULFILLING" || status === "SHIPPED"
        ? "bg-primary text-primary-foreground"
        : status === "CANCELLED" || status === "REFUNDED"
          ? "bg-destructive text-destructive-foreground"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
