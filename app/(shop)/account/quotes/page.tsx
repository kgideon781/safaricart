import Link from "next/link";
import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { requireSession } from "@/server/auth";
import { getMyQuoteRequests } from "@/server/queries/quotes";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "My quote requests" };

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending review", className: "bg-accent text-accent-foreground" },
  QUOTED: { label: "Quote ready", className: "bg-secondary text-secondary-foreground" },
  ACCEPTED: { label: "Accepted", className: "bg-primary text-primary-foreground" },
  DECLINED: { label: "Declined", className: "bg-muted text-muted-foreground" },
  CLOSED: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

export default async function MyQuotesPage() {
  const session = await requireSession("/account/quotes");
  const quotes = await getMyQuoteRequests(session.user.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">Quote requests</h2>
          <p className="text-sm text-muted-foreground">
            Items you&apos;ve asked us to source.
          </p>
        </div>
        <Link
          href="/request-quote"
          className={buttonVariants({ size: "sm" })}
        >
          New request
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <FileText className="mx-auto mb-2 size-8 text-muted-foreground" />
          <h3 className="font-heading text-lg font-semibold">No requests yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Can&apos;t find an item on SafariCart? Send us a quote request and
            we&apos;ll source it for you.
          </p>
          <Link
            href="/request-quote"
            className={`${buttonVariants({ size: "sm" })} mt-4`}
          >
            Request a quote
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
          {quotes.map((q) => {
            const status = STATUS_LABEL[q.status] ?? STATUS_LABEL.PENDING;
            return (
              <li key={q.id} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/account/quotes/${q.id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {q.title}
                    </Link>
                    <Badge className={status.className}>{status.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Qty {q.quantity}
                    {q.targetPriceKes && (
                      <> · Target {formatKES(q.targetPriceKes)}</>
                    )}
                    {" · "}
                    {new Intl.DateTimeFormat("en-KE", {
                      dateStyle: "medium",
                    }).format(q.createdAt)}
                  </p>
                </div>
                {q.adminReplyKes != null && (
                  <div className="hidden text-right md:block">
                    <span className="text-xs text-muted-foreground">
                      Quoted
                    </span>
                    <div className="font-heading text-base font-bold text-primary">
                      {formatKES(q.adminReplyKes)}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
