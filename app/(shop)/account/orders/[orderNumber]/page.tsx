import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { requireSession } from "@/server/auth";
import { getOrderByNumberForUser } from "@/server/queries/orders";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKES, formatKenyanPhone } from "@/lib/kenya";

type RouteParams = Promise<{ orderNumber: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

const statusVariant: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-muted text-muted-foreground" },
  AWAITING_PAYMENT: { label: "Awaiting payment", className: "bg-accent text-accent-foreground" },
  PAID: { label: "Paid", className: "bg-secondary text-secondary-foreground" },
  FULFILLING: { label: "Fulfilling", className: "bg-secondary text-secondary-foreground" },
  SHIPPED: { label: "Shipped", className: "bg-primary text-primary-foreground" },
  DELIVERED: { label: "Delivered", className: "bg-secondary text-secondary-foreground" },
  CANCELLED: { label: "Cancelled", className: "bg-destructive text-destructive-foreground" },
  REFUNDED: { label: "Refunded", className: "bg-muted text-muted-foreground" },
};

export default async function OrderDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const { orderNumber } = await params;
  const session = await requireSession(`/account/orders/${orderNumber}`);
  const order = await getOrderByNumberForUser(orderNumber, session.user.id);
  if (!order) notFound();

  const status = statusVariant[order.status];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/account/orders"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold">Order {order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground">
            Placed{" "}
            {order.placedAt.toLocaleDateString("en-KE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge className={status.className}>{status.label}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Shipping to</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{order.shippingRecipientName}</p>
            <p className="text-muted-foreground">
              {formatKenyanPhone(order.shippingRecipientPhone)}
            </p>
            <p className="text-muted-foreground">{order.shippingStreetAddress}</p>
            <p className="text-muted-foreground">
              {[order.shippingSubCounty, order.shippingCounty]
                .filter(Boolean)
                .join(", ")}
            </p>
            {order.shippingLandmark && (
              <p className="italic text-muted-foreground">
                Landmark: {order.shippingLandmark}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Payment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{order.paymentMethod.replace(/_/g, " ")}</p>
            <p className="text-muted-foreground">
              {order.paidAt
                ? `Paid on ${order.paidAt.toLocaleDateString("en-KE")}`
                : order.status === "AWAITING_PAYMENT"
                  ? "Awaiting payment confirmation"
                  : "Will be collected on delivery"}
            </p>
            {order.paymentReference && (
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                Ref: {order.paymentReference}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.productImage && (
                    <Image
                      src={item.productImage}
                      alt={item.productTitle}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.productTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Sold by {item.vendor.name} ·{" "}
                    {item.fulfillmentStatus.toLowerCase()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.quantity}× {formatKES(item.unitPriceKes)}
                  </p>
                </div>
                <span className="self-start font-heading font-bold text-primary">
                  {formatKES(item.subtotalKes)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatKES(order.subtotalKes)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>
                {order.shippingFeeKes === 0
                  ? "Free"
                  : formatKES(order.shippingFeeKes)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
              <span className="font-heading text-base font-semibold">Total</span>
              <span className="font-heading text-lg font-bold text-primary">
                {formatKES(order.totalKes)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
