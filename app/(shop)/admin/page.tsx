import Link from "next/link";
import type { Metadata } from "next";
import {
  Package,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import { getAdminStats } from "@/server/queries/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const cards = [
    {
      label: "Pending vendors",
      value: stats.pendingVendorCount.toLocaleString("en-KE"),
      icon: ShieldAlert,
      href: "/admin/vendors",
      highlight: stats.pendingVendorCount > 0,
    },
    {
      label: "Users",
      value: stats.userCount.toLocaleString("en-KE"),
      icon: UsersIcon,
      href: "/admin/users",
    },
    {
      label: "Products",
      value: stats.productCount.toLocaleString("en-KE"),
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Orders",
      value: stats.orderCount.toLocaleString("en-KE"),
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      label: "Gross revenue",
      value: formatKES(stats.grossRevenueKes),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const inner = (
          <Card
            className={
              card.highlight
                ? "border-accent/50 bg-accent/5"
                : undefined
            }
          >
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
  );
}
