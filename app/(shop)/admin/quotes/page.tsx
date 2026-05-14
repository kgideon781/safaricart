import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/server/auth";
import {
  listQuoteRequestsForAdmin,
  type QuoteListFilter,
} from "@/server/queries/quotes";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Quote requests" };

const TABS: { value: QuoteListFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-accent text-accent-foreground" },
  QUOTED: { label: "Quoted", className: "bg-secondary text-secondary-foreground" },
  ACCEPTED: { label: "Accepted", className: "bg-primary text-primary-foreground" },
  DECLINED: { label: "Declined", className: "bg-muted text-muted-foreground" },
  CLOSED: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

type SearchParams = Promise<{ filter?: string }>;

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("ADMIN", "/admin/quotes");
  const sp = await searchParams;
  const filter: QuoteListFilter = TABS.some((t) => t.value === sp.filter)
    ? (sp.filter as QuoteListFilter)
    : "pending";

  const quotes = await listQuoteRequestsForAdmin(filter);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-bold">Quote requests</h2>
        <p className="text-sm text-muted-foreground">
          Items customers have asked us to source.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/quotes?filter=${t.value}`}
            className={`rounded-full border px-2.5 py-1 ${
              filter === t.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No requests in this view.
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
                      href={`/admin/quotes/${q.id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {q.title}
                    </Link>
                    <Badge className={status.className}>{status.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {q.user.name ?? q.user.email} · Qty {q.quantity}
                    {q.targetPriceKes && <> · Target {formatKES(q.targetPriceKes)}</>}
                    {" · "}
                    {new Intl.DateTimeFormat("en-KE", {
                      dateStyle: "medium",
                    }).format(q.createdAt)}
                  </p>
                </div>
                {q.adminReplyKes != null && (
                  <div className="hidden text-right md:block">
                    <span className="text-xs text-muted-foreground">Quoted</span>
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
