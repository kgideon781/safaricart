import type { Metadata } from "next";
import { Package } from "lucide-react";
import { requireVendor } from "@/server/vendor";
import { getVendorOrderItems } from "@/server/queries/vendor";
import { updateOrderItemStatusAction } from "@/server/actions/vendor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/kenya";
import type { OrderItemFulfillmentStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Orders" };

const inputClass =
  "h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const statusVariant: Record<
  OrderItemFulfillmentStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "bg-muted text-muted-foreground" },
  FULFILLING: { label: "Fulfilling", className: "bg-accent text-accent-foreground" },
  SHIPPED: { label: "Shipped", className: "bg-primary text-primary-foreground" },
  DELIVERED: { label: "Delivered", className: "bg-secondary text-secondary-foreground" },
  CANCELLED: { label: "Cancelled", className: "bg-destructive text-destructive-foreground" },
};

const STATUS_OPTIONS: OrderItemFulfillmentStatus[] = [
  "PENDING",
  "FULFILLING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default async function VendorOrdersPage() {
  const { vendor } = await requireVendor("/vendor/dashboard/orders");
  const items = await getVendorOrderItems(vendor.id);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
          <Package className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 font-heading text-lg font-semibold">No orders yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          When customers buy your products, you'll manage fulfillment here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-bold">Orders</h2>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {items.map((item) => {
          const variant = statusVariant[item.fulfillmentStatus];
          return (
            <li
              key={item.id}
              className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.productTitle}</span>
                  <Badge className={variant.className}>{variant.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Order {item.order.orderNumber} ·{" "}
                  {item.order.placedAt.toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {item.quantity}× · Ship to {item.order.shippingRecipientName}
                  {item.order.shippingSubCounty
                    ? `, ${item.order.shippingSubCounty}`
                    : ""}
                  , {item.order.shippingCounty}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-heading font-bold text-primary">
                  {formatKES(item.subtotalKes)}
                </span>
                <form
                  action={updateOrderItemStatusAction}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="orderItemId" value={item.id} />
                  <select
                    name="status"
                    defaultValue={item.fulfillmentStatus}
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {statusVariant[s].label}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="xs">
                    Update
                  </Button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
