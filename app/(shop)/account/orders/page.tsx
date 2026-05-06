import Link from "next/link";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import { requireSession } from "@/server/auth";
import { getUserOrders } from "@/server/queries/account";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatKES } from "@/lib/kenya";
import type { OrderStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Orders" };

const statusVariants: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-muted text-muted-foreground" },
  AWAITING_PAYMENT: { label: "Awaiting payment", className: "bg-accent text-accent-foreground" },
  PAID: { label: "Paid", className: "bg-secondary text-secondary-foreground" },
  FULFILLING: { label: "Fulfilling", className: "bg-secondary text-secondary-foreground" },
  SHIPPED: { label: "Shipped", className: "bg-primary text-primary-foreground" },
  DELIVERED: { label: "Delivered", className: "bg-secondary text-secondary-foreground" },
  CANCELLED: { label: "Cancelled", className: "bg-destructive text-destructive-foreground" },
  REFUNDED: { label: "Refunded", className: "bg-muted text-muted-foreground" },
};

export default async function OrdersPage() {
  const session = await requireSession("/account/orders");
  const orders = await getUserOrders(session.user.id);

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
          <Package className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 font-heading text-lg font-semibold">No orders yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          When you place your first order it will appear here.
        </p>
        <Link href="/" className={`${buttonVariants({ size: "sm" })} mt-4`}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-bold">Order history</h2>
      <ul className="flex flex-col gap-3">
        {orders.map((order) => {
          const status = statusVariants[order.status];
          const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
          return (
            <li
              key={order.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-lg font-semibold">
                    Order {order.orderNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Placed{" "}
                    {order.placedAt.toLocaleDateString("en-KE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {totalItems} item{totalItems === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={status.className}>{status.label}</Badge>
                  <span className="font-heading text-lg font-bold text-primary">
                    {formatKES(order.totalKes)}
                  </span>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {order.items.slice(0, 3).map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md bg-muted px-2 py-1"
                  >
                    {item.quantity}× {item.productTitle}
                  </li>
                ))}
                {order.items.length > 3 && (
                  <li className="rounded-md bg-muted px-2 py-1">
                    +{order.items.length - 3} more
                  </li>
                )}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
