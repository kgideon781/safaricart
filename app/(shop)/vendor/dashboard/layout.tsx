import Link from "next/link";
import { LayoutDashboard, Package, Settings, ShoppingCart, Store } from "lucide-react";
import { requireVendor } from "@/server/vendor";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/vendor/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/vendor/dashboard/products", label: "Products", icon: Package },
  { href: "/vendor/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/vendor/dashboard/settings", label: "Settings", icon: Settings },
];

const statusVariant: Record<
  "PENDING" | "APPROVED" | "SUSPENDED",
  { label: string; className: string }
> = {
  PENDING: { label: "Pending review", className: "bg-accent text-accent-foreground" },
  APPROVED: { label: "Approved", className: "bg-secondary text-secondary-foreground" },
  SUSPENDED: { label: "Suspended", className: "bg-destructive text-destructive-foreground" },
};

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { vendor } = await requireVendor("/vendor/dashboard");
  const status = statusVariant[vendor.status];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Store className="size-5 text-muted-foreground" />
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              {vendor.name}
            </h1>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Vendor dashboard · /{vendor.slug}
          </p>
        </div>
      </div>

      {vendor.status === "PENDING" && (
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm">
          <p className="font-medium text-foreground">Your application is under review</p>
          <p className="mt-1 text-muted-foreground">
            You can list products now, but they won't appear in the public
            catalog until your account is approved by an admin.
          </p>
        </div>
      )}

      {vendor.status === "SUSPENDED" && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">Account suspended</p>
          <p className="mt-1 text-muted-foreground">
            Contact support@safaricart.local to resolve this.
          </p>
        </div>
      )}

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
