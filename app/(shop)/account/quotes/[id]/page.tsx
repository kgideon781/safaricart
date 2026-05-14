import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession } from "@/server/auth";
import { getMyQuoteRequest } from "@/server/queries/quotes";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatKES } from "@/lib/kenya";
import { DecisionForm } from "./decision-form";

export const metadata: Metadata = { title: "Quote request" };

type RouteParams = Promise<{ id: string }>;

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending review", className: "bg-accent text-accent-foreground" },
  QUOTED: { label: "Quote ready", className: "bg-secondary text-secondary-foreground" },
  ACCEPTED: { label: "Accepted", className: "bg-primary text-primary-foreground" },
  DECLINED: { label: "Declined", className: "bg-muted text-muted-foreground" },
  CLOSED: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

export default async function QuoteDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const { id } = await params;
  const session = await requireSession(`/account/quotes/${id}`);
  const quote = await getMyQuoteRequest({ id, userId: session.user.id });
  if (!quote) notFound();

  const status = STATUS_LABEL[quote.status] ?? STATUS_LABEL.PENDING;
  const expired =
    quote.adminReplyExpires != null && quote.adminReplyExpires < new Date();
  const canDecide = quote.status === "QUOTED" && !expired;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/account/quotes"
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
                Submitted{" "}
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
            <Detail label="Contact phone">{quote.contactPhone}</Detail>
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
                  <div
                    key={u}
                    className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                  >
                    <Image
                      src={u}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {quote.status === "PENDING" && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            We&apos;ve received your request and our team will get back to you,
            usually within 1–2 business days. We&apos;ll email you as soon as we
            have a price.
          </CardContent>
        </Card>
      )}

      {(quote.status === "QUOTED" ||
        quote.status === "ACCEPTED" ||
        quote.status === "DECLINED") &&
        quote.adminReplyKes != null && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Our quote
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <Detail label="Quoted price">
                  <span className="font-heading text-lg font-bold text-primary">
                    {formatKES(quote.adminReplyKes)}
                  </span>
                </Detail>
                {quote.adminReplyLeadTime && (
                  <Detail label="Lead time">{quote.adminReplyLeadTime}</Detail>
                )}
                {quote.adminReplyExpires && (
                  <Detail label="Valid until">
                    {new Intl.DateTimeFormat("en-KE", {
                      dateStyle: "medium",
                    }).format(quote.adminReplyExpires)}
                    {expired && (
                      <span className="ml-1 text-destructive">(expired)</span>
                    )}
                  </Detail>
                )}
              </div>
              {quote.adminReplyNotes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Notes from our team
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                    {quote.adminReplyNotes}
                  </p>
                </div>
              )}

              {canDecide && <DecisionForm quoteId={quote.id} />}

              {quote.status === "ACCEPTED" && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                  You&apos;ve accepted this quote. Our team will reach out at{" "}
                  <strong>{quote.contactPhone}</strong> to complete the
                  order.
                </div>
              )}
              {quote.status === "DECLINED" && (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  You declined this quote.
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {quote.status === "CLOSED" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Request closed</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {quote.adminReplyNotes ? (
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {quote.adminReplyNotes}
              </p>
            ) : (
              <p className="text-muted-foreground">
                This request was closed without a quote.
              </p>
            )}
            <Link
              href="/request-quote"
              className={`${buttonVariants({ size: "sm" })} self-start`}
            >
              Submit a new request
            </Link>
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
