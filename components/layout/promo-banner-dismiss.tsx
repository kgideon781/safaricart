"use client";

import { useTransition } from "react";
import { X } from "lucide-react";

export function DismissBannerButton({
  campaignId,
  cookiePrefix,
}: {
  campaignId: string;
  cookiePrefix: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Dismiss banner"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          // 30-day persistent cookie. Server-rendered banner reads this on
          // the next request and skips render.
          document.cookie = `${cookiePrefix}${campaignId}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
          window.location.reload();
        });
      }}
      className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-primary-foreground/10"
    >
      <X className="size-4" />
    </button>
  );
}
