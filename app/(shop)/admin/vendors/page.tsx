import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getAllVendors } from "@/server/queries/admin";
import {
  approveVendorAction,
  suspendVendorAction,
  reactivateVendorAction,
} from "@/server/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin · Vendors" };

const statusVariant = {
  PENDING: { label: "Pending", className: "bg-accent text-accent-foreground" },
  APPROVED: { label: "Approved", className: "bg-secondary text-secondary-foreground" },
  SUSPENDED: { label: "Suspended", className: "bg-destructive text-destructive-foreground" },
} as const;

export default async function AdminVendorsPage() {
  const vendors = await getAllVendors();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-bold">Vendors</h2>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {vendors.map((v) => {
          const status = statusVariant[v.status];
          return (
            <li
              key={v.id}
              className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{v.name}</span>
                  <Badge className={status.className}>{status.label}</Badge>
                  <Link
                    href={`/vendor/${v.slug}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    /{v.slug} <ExternalLink className="inline size-3" />
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.user.email} · {v.county} · {v._count.products} product
                  {v._count.products === 1 ? "" : "s"} ·{" "}
                  {v.contactPhone}
                </p>
                {v.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {v.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {v.status === "PENDING" && (
                  <form action={approveVendorAction}>
                    <input type="hidden" name="id" value={v.id} />
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                )}
                {v.status === "APPROVED" && (
                  <form action={suspendVendorAction}>
                    <input type="hidden" name="id" value={v.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      Suspend
                    </Button>
                  </form>
                )}
                {v.status === "SUSPENDED" && (
                  <form action={reactivateVendorAction}>
                    <input type="hidden" name="id" value={v.id} />
                    <Button type="submit" size="sm">
                      Reactivate
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
