import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { DismissBannerButton } from "./promo-banner-dismiss";

const DISMISS_COOKIE_PREFIX = "promo-dismissed-";

export async function PromoBanner() {
  const now = new Date();
  const campaign = await db.campaign.findFirst({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      message: true,
      ctaLabel: true,
      ctaHref: true,
      isDismissible: true,
    },
  });
  if (!campaign) return null;

  // Cookie key embeds the campaign id so a dismiss for an old campaign doesn't
  // hide a new one. Cleared automatically when the campaign rolls over.
  const cookieStore = await cookies();
  if (campaign.isDismissible && cookieStore.get(`${DISMISS_COOKIE_PREFIX}${campaign.id}`)) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2 text-sm md:px-6">
        <span className="flex-1 truncate md:whitespace-normal">
          {campaign.message}
        </span>
        {campaign.ctaHref && campaign.ctaLabel && (
          <Link
            href={campaign.ctaHref}
            className="shrink-0 rounded-md bg-primary-foreground px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary-foreground/90"
          >
            {campaign.ctaLabel}
          </Link>
        )}
        {campaign.isDismissible && (
          <DismissBannerButton campaignId={campaign.id} cookiePrefix={DISMISS_COOKIE_PREFIX} />
        )}
      </div>
    </div>
  );
}
