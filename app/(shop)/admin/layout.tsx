import Link from "next/link";
import {
  Flag,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  Package,
  Percent,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import { requireRole } from "@/server/auth";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/vendors", label: "Vendors", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
  { href: "/admin/coupons", label: "Coupons", icon: Percent },
  { href: "/admin/reviews", label: "Reviews", icon: Flag },
  { href: "/admin/integrations", label: "Integrations", icon: KeyRound },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN", "/admin");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal tooling — handle with care.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
