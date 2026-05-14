import "server-only";
import { db } from "@/server/db";

export async function getMyQuoteRequests(userId: string) {
  return db.quoteRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      quantity: true,
      status: true,
      targetPriceKes: true,
      adminReplyKes: true,
      adminReplyAt: true,
      adminReplyExpires: true,
      createdAt: true,
    },
  });
}

export async function getMyQuoteRequest(opts: { id: string; userId: string }) {
  return db.quoteRequest.findFirst({
    where: { id: opts.id, userId: opts.userId },
  });
}

export type QuoteListFilter = "all" | "pending" | "quoted" | "accepted" | "declined" | "closed";

export async function listQuoteRequestsForAdmin(filter: QuoteListFilter = "all") {
  const where =
    filter === "all"
      ? {}
      : { status: filter.toUpperCase() as "PENDING" | "QUOTED" | "ACCEPTED" | "DECLINED" | "CLOSED" };
  return db.quoteRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
    },
  });
}

export async function getQuoteRequestForAdmin(id: string) {
  return db.quoteRequest.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
}

export async function countPendingQuoteRequests(): Promise<number> {
  return db.quoteRequest.count({ where: { status: "PENDING" } });
}
