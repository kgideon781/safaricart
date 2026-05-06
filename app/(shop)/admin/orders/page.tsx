import type { Metadata } from "next";
import Link from "next/link";
import { getAllOrders } from "@/server/queries/admin";
import { markOrderPaidAction } from "@/server/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/kenya";
import type { OrderStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Admin · Orders" };

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

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-bold">Orders</h2>
        <p className="text-sm text-muted-foreground">
          Showing the {orders.length} most recent orders. The "Mark paid"
          action exists for testing — real payment confirmations come from
          provider webhooks.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {orders.map((o) => {
          const status = statusVariant[o.status];
          return (
            <li key={o.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/account/orders/${o.orderNumber}`}
                    className="font-medium hover:text-primary"
                  >
                    {o.orderNumber}
                  </Link>
                  <Badge className={status.className}>{status.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {o.paymentMethod.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {o.user.name ?? o.user.email} · {o._count.items} item
                  {o._count.items === 1 ? "" : "s"} ·{" "}
                  {o.placedAt.toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-heading font-bold text-primary">
                  {formatKES(o.totalKes)}
                </span>
                {o.status === "AWAITING_PAYMENT" && (
                  <form action={markOrderPaidAction}>
                    <input type="hidden" name="id" value={o.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Mark paid
                    </Button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
