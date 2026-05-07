import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { db } from "@/server/db";
import {
  flagReviewAction,
  hideReviewAction,
  unhideReviewAction,
  deleteReviewAction,
} from "@/server/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Admin · Reviews" };

export default async function AdminReviewsPage() {
  // Show flagged + hidden first; then most recent.
  const reviews = await db.review.findMany({
    orderBy: [{ isFlagged: "desc" }, { isHidden: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      user: { select: { email: true, name: true } },
      product: { select: { title: true, slug: true } },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-bold">Reviews</h2>
        <p className="text-sm text-muted-foreground">
          Showing the {reviews.length} most recent reviews. Flagged or hidden
          reviews appear first.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {reviews.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">
            No reviews yet.
          </li>
        )}
        {reviews.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-0.5 text-accent">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </span>
              <Link
                href={`/product/${r.product.slug}`}
                className="font-medium hover:text-primary"
              >
                {r.product.title}
              </Link>
              <span className="text-muted-foreground">
                · {r.user.name ?? r.user.email}
              </span>
              {r.isFlagged && <Badge variant="destructive">Flagged</Badge>}
              {r.isHidden && <Badge variant="outline">Hidden</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">
                {r.createdAt.toLocaleDateString("en-KE", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            {r.title && <p className="font-semibold">{r.title}</p>}
            <p className="text-sm text-muted-foreground">{r.body}</p>
            {r.flagReason && (
              <p className="text-xs text-destructive">
                Flagged: {r.flagReason}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {!r.isFlagged && (
                <form action={flagReviewAction} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={r.id} />
                  <Input
                    name="reason"
                    placeholder="Flag reason"
                    className="h-8 w-40 text-xs"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Flag
                  </Button>
                </form>
              )}
              {!r.isHidden && (
                <form action={hideReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Hide
                  </Button>
                </form>
              )}
              {(r.isHidden || r.isFlagged) && (
                <form action={unhideReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Restore
                  </Button>
                </form>
              )}
              <form action={deleteReviewAction}>
                <input type="hidden" name="id" value={r.id} />
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
