"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireSession, requireRole } from "@/server/auth";
import { KENYAN_COUNTIES, normalizeKenyanPhone } from "@/lib/kenya";
import { logger } from "@/server/log";
import type { FormResult } from "@/server/actions/account";
import {
  notifyAdminsNewQuoteRequest,
  sendQuoteAck,
  sendQuoteReadyEmail,
  sendQuoteClosedEmail,
} from "@/server/email/quotes";

const log = logger("quote-actions");

// ─── Submit ───────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().trim().min(3, "Give the item a short title").max(150),
  description: z.string().trim().min(10, "Describe what you need").max(3000),
  quantity: z.coerce.number().int().min(1).max(10_000),
  targetPriceKes: z
    .preprocess(
      (v) => (v === "" || v == null ? null : v),
      z.coerce.number().int().positive().nullable(),
    )
    .optional(),
  contactPhone: z.string().trim().min(1, "Phone number is required"),
  preferredCounty: z
    .string()
    .optional()
    .transform((v) => (v === "" || v == null ? undefined : v))
    .refine(
      (v) => v == null || (KENYAN_COUNTIES as readonly string[]).includes(v),
      { message: "Pick a valid Kenyan county" },
    ),
  imageUrls: z
    .preprocess(
      (v) => {
        if (typeof v !== "string" || v.trim() === "") return [];
        try {
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      },
      z.array(z.string().url()).max(4, "Up to 4 reference images"),
    )
    .default([]),
});

export async function createQuoteRequestAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const session = await requireSession("/request-quote");

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    quantity: formData.get("quantity") ?? "1",
    targetPriceKes: formData.get("targetPriceKes"),
    contactPhone: formData.get("contactPhone"),
    preferredCounty: formData.get("preferredCounty") ?? undefined,
    imageUrls: formData.get("imageUrls") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const phone = normalizeKenyanPhone(parsed.data.contactPhone);
  if (!phone) {
    return { fieldErrors: { contactPhone: ["Enter a valid Kenyan mobile number"] } };
  }

  const created = await db.quoteRequest.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      quantity: parsed.data.quantity,
      targetPriceKes: parsed.data.targetPriceKes ?? null,
      contactPhone: phone,
      preferredCounty: parsed.data.preferredCounty ?? null,
      imageUrls: parsed.data.imageUrls,
    },
  });

  // Best-effort emails — failures don't block the form.
  notifyAdminsNewQuoteRequest({
    quoteId: created.id,
    title: created.title,
    quantity: created.quantity,
    targetPriceKes: created.targetPriceKes,
    customerName: session.user.name ?? null,
    customerEmail: session.user.email ?? "",
  }).catch((err) => log.error("admin notify failed", { err: String(err) }));

  if (session.user.email) {
    sendQuoteAck({
      to: session.user.email,
      name: session.user.name ?? null,
      title: created.title,
      quoteId: created.id,
    }).catch((err) => log.error("customer ack failed", { err: String(err) }));
  }

  revalidatePath("/account/quotes");
  redirect(`/account/quotes/${created.id}`);
}

// ─── Admin reply ──────────────────────────────────────────────────────────

const replySchema = z.object({
  id: z.string().min(1),
  priceKes: z.coerce.number().int().min(1, "Quote a price"),
  leadTime: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  notes: z
    .string()
    .trim()
    .max(3000)
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  validDays: z.coerce.number().int().min(1).max(60).default(7),
});

export async function replyQuoteRequestAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const session = await requireRole("ADMIN", "/admin/quotes");
  const parsed = replySchema.safeParse({
    id: formData.get("id"),
    priceKes: formData.get("priceKes"),
    leadTime: formData.get("leadTime") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    validDays: formData.get("validDays") ?? "7",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const expires = new Date(Date.now() + parsed.data.validDays * 24 * 60 * 60 * 1000);

  const updated = await db.quoteRequest.update({
    where: { id: parsed.data.id },
    data: {
      status: "QUOTED",
      adminReplyKes: parsed.data.priceKes,
      adminReplyLeadTime: parsed.data.leadTime,
      adminReplyNotes: parsed.data.notes,
      adminReplyAt: new Date(),
      adminReplyBy: session.user.id,
      adminReplyExpires: expires,
    },
    include: { user: { select: { email: true, name: true } } },
  });

  if (updated.user.email) {
    sendQuoteReadyEmail({
      to: updated.user.email,
      name: updated.user.name ?? null,
      quoteId: updated.id,
      title: updated.title,
      priceKes: parsed.data.priceKes,
      leadTime: parsed.data.leadTime,
      notes: parsed.data.notes,
      expiresAt: expires,
    }).catch((err) => log.error("customer reply email failed", { err: String(err) }));
  }

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${updated.id}`);
  revalidatePath(`/account/quotes/${updated.id}`);
  return { success: "Quote sent to the customer." };
}

// ─── Admin close ──────────────────────────────────────────────────────────

const closeSchema = z.object({
  id: z.string().min(1),
  reason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
});

export async function closeQuoteRequestAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  await requireRole("ADMIN", "/admin/quotes");
  const parsed = closeSchema.safeParse({
    id: formData.get("id"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid input" };

  const updated = await db.quoteRequest.update({
    where: { id: parsed.data.id },
    data: {
      status: "CLOSED",
      adminReplyNotes: parsed.data.reason,
      adminReplyAt: new Date(),
    },
    include: { user: { select: { email: true, name: true } } },
  });

  if (updated.user.email) {
    sendQuoteClosedEmail({
      to: updated.user.email,
      name: updated.user.name ?? null,
      quoteId: updated.id,
      title: updated.title,
      reason: parsed.data.reason,
    }).catch((err) => log.error("customer close email failed", { err: String(err) }));
  }

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${updated.id}`);
  revalidatePath(`/account/quotes/${updated.id}`);
  return { success: "Quote request closed." };
}

// ─── Customer accept / decline ────────────────────────────────────────────

const decisionSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["accept", "decline"]),
  reason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
});

export async function decideQuoteRequestAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const session = await requireSession("/account/quotes");
  const parsed = decisionSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid input" };

  // Ownership + status check
  const existing = await db.quoteRequest.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
    select: { id: true, status: true, adminReplyExpires: true },
  });
  if (!existing) return { error: "Quote not found" };
  if (existing.status !== "QUOTED") {
    return { error: "This quote can no longer be decided." };
  }
  if (existing.adminReplyExpires && existing.adminReplyExpires < new Date()) {
    return { error: "This quote has expired. Submit a new request." };
  }

  await db.quoteRequest.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.decision === "accept" ? "ACCEPTED" : "DECLINED",
      customerDecisionAt: new Date(),
      customerDeclineReason:
        parsed.data.decision === "decline" ? parsed.data.reason : null,
    },
  });

  // TODO: when accepted, hand off to checkout / admin follow-up. For v1 we
  // just mark ACCEPTED — admin contacts the customer to complete the order.

  revalidatePath("/account/quotes");
  revalidatePath(`/account/quotes/${existing.id}`);
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${existing.id}`);
  return {
    success:
      parsed.data.decision === "accept"
        ? "Quote accepted. We'll follow up to complete the order."
        : "Quote declined.",
  };
}
