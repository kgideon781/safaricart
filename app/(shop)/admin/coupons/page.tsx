import type { Metadata } from "next";
import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKES } from "@/lib/kenya";
import { CouponForm } from "./coupon-form";
import {
  toggleCouponAction,
  deleteCouponAction,
} from "@/server/actions/admin";

export const metadata: Metadata = { title: "Admin · Coupons" };

export default async function AdminCouponsPage() {
  const [coupons, vendors] = await Promise.all([
    db.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { name: true, slug: true } },
        _count: { select: { redemptions: true } },
      },
    }),
    db.vendor.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Coupons</h2>
        <p className="text-sm text-muted-foreground">
          Promo codes customers can apply at checkout.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">New coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponForm vendors={vendors} />
        </CardContent>
      </Card>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {coupons.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">
            No coupons yet — create one above.
          </li>
        )}
        {coupons.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold">{c.code}</span>
                <Badge variant={c.isActive ? "default" : "outline"}>
                  {c.isActive ? "Active" : "Inactive"}
                </Badge>
                {c.expiresAt && c.expiresAt.getTime() < Date.now() && (
                  <Badge variant="outline">Expired</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {c.type === "PERCENT"
                  ? `${(c.value / 100).toFixed(c.value % 100 === 0 ? 0 : 2)}% off`
                  : `${formatKES(c.value)} off`}
                {c.minSubtotalKes > 0 && ` · min ${formatKES(c.minSubtotalKes)}`}
                {c.maxDiscountKes && ` · max ${formatKES(c.maxDiscountKes)}`}
                {c.vendor && ` · vendor ${c.vendor.name}`}
                {c.maxUses && ` · ${c._count.redemptions}/${c.maxUses} uses`}
                {!c.maxUses && ` · ${c._count.redemptions} uses`}
                {c.perUserLimit && ` · ${c.perUserLimit}/user`}
                {c.expiresAt &&
                  ` · expires ${c.expiresAt.toLocaleDateString("en-KE")}`}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={toggleCouponAction}>
                <input type="hidden" name="id" value={c.id} />
                <Button type="submit" size="sm" variant="outline">
                  {c.isActive ? "Deactivate" : "Activate"}
                </Button>
              </form>
              <form action={deleteCouponAction}>
                <input type="hidden" name="id" value={c.id} />
                <Button type="submit" size="sm" variant="ghost">
                  Delete
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
