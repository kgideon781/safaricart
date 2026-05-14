import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/server/auth";
import { getQuoteRequestForAdmin } from "@/server/queries/quotes";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKES } from "@/lib/kenya";
import { ReplyForm } from "./reply-form";
import { CloseForm } from "./close-form";

export const metadata: Metadata = { title: "Quote request" };

type RouteParams = Promise<{ id: string }>;

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-accent text-accent-foreground" },
  QUOTED: { label: "Quoted", className: "bg-secondary text-secondary-foreground" },
  ACCEPTED: { label: "Accepted", className: "bg-primary text-primary-foreground" },
  DECLINED: { label: "Declined", className: "bg-muted text-muted-foreground" },
  CLOSED: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  await requireRole("ADMIN", "/admin/quotes");
  const { id } = await params;
  const quote = await getQuoteRequestForAdmin(id);
  if (!quote) notFound();

  const status = STATUS_LABEL[quote.status] ?? STATUS_LABEL.PENDING;
  const stillReplyable = quote.status === "PENDING" || quote.status === "QUOTED";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/quotes"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← All requests
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="font-heading text-2xl">{quote.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                From {quote.user.name ?? "(no name)"} &lt;{quote.user.email}&gt; ·{" "}
                {new Intl.DateTimeFormat("en-KE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(quote.createdAt)}
              </p>
            </div>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <Detail label="Quantity">{quote.quantity}</Detail>
            {quote.targetPriceKes && (
              <Detail label="Target price">{formatKES(quote.targetPriceKes)}</Detail>
            )}
            <Detail label="Customer phone">{quote.contactPhone}</Detail>
            {quote.preferredCounty && (
              <Detail label="Delivery county">{quote.preferredCounty}</Detail>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Details
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
              {quote.description}
            </p>
          </div>
          {quote.imageUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Reference photos
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quote.imageUrls.map((u) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                  >
                    <Image
                      src={u}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {quote.status === "QUOTED" && quote.adminReplyKes != null && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Current quote</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <Detail label="Price">
              <span className="font-heading text-lg font-bold text-primary">
                {formatKES(quote.adminReplyKes)}
              </span>
            </Detail>
            {quote.adminReplyLeadTime && (
              <Detail label="Lead time">{quote.adminReplyLeadTime}</Detail>
            )}
            {quote.adminReplyExpires && (
              <Detail label="Expires">
                {new Intl.DateTimeFormat("en-KE", {
                  dateStyle: "medium",
                }).format(quote.adminReplyExpires)}
              </Detail>
            )}
            {quote.adminReplyNotes && (
              <div className="md:col-span-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                  {quote.adminReplyNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {stillReplyable && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              {quote.status === "QUOTED" ? "Update quote" : "Send a quote"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReplyForm
              quoteId={quote.id}
              initial={{
                priceKes: quote.adminReplyKes ?? null,
                leadTime: quote.adminReplyLeadTime ?? "",
                notes: quote.adminReplyNotes ?? "",
              }}
            />
          </CardContent>
        </Card>
      )}

      {quote.status === "ACCEPTED" && (
        <Card>
          <CardContent className="pt-6 text-sm">
            Customer accepted on{" "}
            {quote.customerDecisionAt &&
              new Intl.DateTimeFormat("en-KE", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(quote.customerDecisionAt)}
            . Reach out at <strong>{quote.contactPhone}</strong> or{" "}
            <strong>{quote.user.email}</strong> to complete the order.
          </CardContent>
        </Card>
      )}

      {quote.status === "DECLINED" && (
        <Card>
          <CardContent className="pt-6 text-sm">
            Customer declined the quote
            {quote.customerDecisionAt && (
              <>
                {" "}
                on{" "}
                {new Intl.DateTimeFormat("en-KE", {
                  dateStyle: "medium",
                }).format(quote.customerDecisionAt)}
              </>
            )}
            .
            {quote.customerDeclineReason && (
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                <em>Their reason:</em> {quote.customerDeclineReason}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {stillReplyable && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Close request</CardTitle>
          </CardHeader>
          <CardContent>
            <CloseForm quoteId={quote.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5">{children}</p>
    </div>
  );
}
