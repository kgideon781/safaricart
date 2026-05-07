import "server-only";
import { headers } from "next/headers";
import { db } from "@/server/db";

/**
 * Tiny fixed-window rate limiter, persisted in Postgres so it works on
 * serverless (Vercel) without an external Redis. One row per (key, window)
 * bucket. Not a sliding window — that's fine for the modest request rates we
 * deal with on auth endpoints.
 *
 * The limiter is best-effort: if the DB is unreachable, we fail-open (return
 * `ok: true`) rather than locking everyone out.
 */
export type LimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: Date;
};

export async function rateLimit(opts: {
  key: string;
  /** Max hits allowed in the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}): Promise<LimitResult> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / opts.windowMs) * opts.windowMs);
  const expiresAt = new Date(windowStart.getTime() + opts.windowMs);

  try {
    const row = await db.rateLimit.upsert({
      where: { key_windowAt: { key: opts.key, windowAt: windowStart } },
      create: { key: opts.key, windowAt: windowStart, hits: 1, expiresAt },
      update: { hits: { increment: 1 } },
    });
    const remaining = Math.max(0, opts.max - row.hits);
    return { ok: row.hits <= opts.max, remaining, resetAt: expiresAt };
  } catch {
    // Fail-open: don't break the user's flow if rate-limit storage hiccups.
    return { ok: true, remaining: opts.max, resetAt: expiresAt };
  }
}

/** Best-effort client IP from common proxy headers. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") || "unknown";
}
