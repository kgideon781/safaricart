import type { Metadata } from "next";
import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm } from "./campaign-form";
import {
  deleteCampaignAction,
  toggleCampaignAction,
} from "@/server/actions/admin";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin · Promotions" };

export default async function AdminPromotionsPage() {
  const [campaigns, coupons] = await Promise.all([
    db.campaign.findMany({
      orderBy: { startsAt: "desc" },
      include: { coupon: { select: { code: true } } },
    }),
    db.coupon.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true },
    }),
  ]);

  const now = Date.now();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Promotions</h2>
        <p className="text-sm text-muted-foreground">
          Site-wide announcement banners. Pair with a coupon for Black-Friday-style
          campaigns.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">New campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignForm coupons={coupons} />
        </CardContent>
      </Card>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {campaigns.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">
            No campaigns yet. Create one above.
          </li>
        )}
        {campaigns.map((c) => {
          const live = c.isActive && c.startsAt.getTime() <= now && c.endsAt.getTime() >= now;
          const upcoming = c.isActive && c.startsAt.getTime() > now;
          const expired = c.endsAt.getTime() < now;
          return (
            <li
              key={c.id}
              className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.title}</span>
                  {live && <Badge>Live</Badge>}
                  {upcoming && <Badge variant="outline">Upcoming</Badge>}
                  {expired && <Badge variant="outline">Expired</Badge>}
                  {!c.isActive && <Badge variant="outline">Disabled</Badge>}
                  {c.coupon && (
                    <Badge variant="outline" className="font-mono">
                      {c.coupon.code}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {c.message}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.startsAt.toLocaleDateString("en-KE")} → {c.endsAt.toLocaleDateString("en-KE")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={toggleCampaignAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button type="submit" variant="outline" size="sm">
                    {c.isActive ? "Disable" : "Enable"}
                  </Button>
                </form>
                <form action={deleteCampaignAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Delete
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
