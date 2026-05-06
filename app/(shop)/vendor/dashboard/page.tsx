import Link from "next/link";
import type { Metadata } from "next";
import { Package, PackageCheck, ShoppingCart, TrendingUp } from "lucide-react";
import { requireVendor } from "@/server/vendor";
import { getVendorStats } from "@/server/queries/vendor";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Vendor dashboard" };

export default async function VendorDashboardPage() {
  const { vendor } = await requireVendor("/vendor/dashboard");
  const stats = await getVendorStats(vendor.id);

  const cards = [
    {
      label: "Products",
      value: stats.productCount.toLocaleString("en-KE"),
      icon: Package,
      href: "/vendor/dashboard/products",
    },
    {
      label: "Orders received",
      value: stats.orderItemCount.toLocaleString("en-KE"),
      icon: ShoppingCart,
      href: "/vendor/dashboard/orders",
    },
    {
      label: "Pending fulfillment",
      value: stats.pendingItems.toLocaleString("en-KE"),
      icon: PackageCheck,
      href: "/vendor/dashboard/orders",
    },
    {
      label: "Revenue",
      value: formatKES(stats.totalRevenueKes),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const inner = (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  {card.label}
                  <Icon className="size-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-2xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          );
          return card.href ? (
            <Link
              key={card.label}
              href={card.href}
              className="block transition-shadow hover:shadow-md"
            >
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link
            href="/vendor/dashboard/products/new"
            className={buttonVariants({ size: "sm" })}
          >
            Add a product
          </Link>
          <Link
            href="/vendor/dashboard/orders"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View pending orders
          </Link>
          <Link
            href={`/vendor/${vendor.slug}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View public storefront
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
