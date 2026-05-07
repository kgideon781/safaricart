"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { slugify } from "@/lib/text";
import { refundStripePaymentIntent } from "@/server/payments/stripe";
import { debitVendorsForRefund, vendorPayableKes } from "@/server/payouts";
import { sendVendorStatusEmail, sendRefundEmail } from "@/server/email/vendor";
import { creditVendorsForOrder } from "@/server/payouts";
import { sendOrderConfirmationEmails } from "@/server/email/orders";
import { logger } from "@/server/log";
import type { FormResult } from "@/server/actions/account";

const log = logger("admin");

// ─── Vendor moderation ────────────────────────────────────────────────────

export async function approveVendorAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/vendors");
  const id = String(formData.get("id"));
  if (!id) return;
  const vendor = await db.vendor.update({
    where: { id },
    data: { status: "APPROVED", verifiedAt: new Date() },
  });
  if (vendor.contactEmail) {
    sendVendorStatusEmail({
      to: vendor.contactEmail,
      vendorName: vendor.name,
      status: "APPROVED",
    }).catch((err) => log.error("vendor email failed", { err: String(err) }));
  }
  revalidatePath("/admin/vendors");
}

export async function suspendVendorAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/vendors");
  const id = String(formData.get("id"));
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  if (!id) return;
  const vendor = await db.vendor.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });
  if (vendor.contactEmail) {
    sendVendorStatusEmail({
      to: vendor.contactEmail,
      vendorName: vendor.name,
      status: "SUSPENDED",
      notes,
    }).catch((err) => log.error("vendor email failed", { err: String(err) }));
  }
  revalidatePath("/admin/vendors");
}

export async function reactivateVendorAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/vendors");
  const id = String(formData.get("id"));
  if (!id) return;
  await db.vendor.update({
    where: { id },
    data: { status: "APPROVED" },
  });
  revalidatePath("/admin/vendors");
}

// ─── Vendor KYC ───────────────────────────────────────────────────────────

const docDecisionSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().max(500).optional(),
});

export async function reviewVendorDocumentAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/vendors");
  const parsed = docDecisionSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  await db.vendorDocument.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.decision, notes: parsed.data.notes },
  });
  revalidatePath("/admin/vendors");
}

// ─── Category CRUD ────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  isFeatured: z
    .union([z.literal("on"), z.literal("true"), z.string()])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export async function createCategoryAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  await requireRole("ADMIN", "/admin/categories");

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? undefined,
    description: formData.get("description") ?? undefined,
    imageUrl: formData.get("imageUrl") ?? undefined,
    isFeatured: formData.get("isFeatured") ?? undefined,
    sortOrder: formData.get("sortOrder") ?? "0",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let slug = parsed.data.slug ?? slugify(parsed.data.name);
  if (!slug) return { error: "Could not derive a slug" };

  let attempt = 0;
  while (await db.category.findUnique({ where: { slug }, select: { id: true } })) {
    attempt += 1;
    slug = `${parsed.data.slug ?? slugify(parsed.data.name)}-${attempt}`;
    if (attempt > 50) return { error: "Slug collision — pick a different name" };
  }

  await db.category.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      isFeatured: parsed.data.isFeatured,
      sortOrder: parsed.data.sortOrder,
    },
  });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/categories");
  const id = String(formData.get("id"));
  if (!id) return;

  const used = await db.product.count({ where: { categoryId: id } });
  if (used > 0) return;

  await db.category.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/categories");
}

// ─── Order moderation ─────────────────────────────────────────────────────

/**
 * Force-mark an order as PAID. Useful for COD/manual reconciliations and
 * while payment webhooks aren't fully wired up.
 */
export async function markOrderPaidAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/orders");
  const id = String(formData.get("id"));
  if (!id) return;
  const order = await db.order.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  // Best-effort: post vendor credits + send confirmation emails so this
  // matches the webhook-driven flow.
  creditVendorsForOrder(order.id).catch((err) =>
    log.error("ledger credit failed", { err: String(err) }),
  );
  sendOrderConfirmationEmails(order.id).catch((err) =>
    log.error("emails failed", { err: String(err) }),
  );
  revalidatePath("/admin/orders");
}

const refundSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(3).max(500),
});

export async function refundOrderAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/orders");
  const parsed = refundSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return;

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { user: true },
  });
  if (!order) return;
  if (order.status === "REFUNDED") return;

  // For Stripe-paid orders, push a real refund through the payment intent.
  // refundStripePaymentIntent reads the active key from the resolver, so it
  // works with whichever creds (env or admin-stored) are currently active.
  if (order.paymentMethod === "STRIPE" && order.paymentReference) {
    try {
      await refundStripePaymentIntent(order.paymentReference);
    } catch (err) {
      log.error("stripe refund failed", { orderId: order.id, err: String(err) });
      // Don't bail — operator may want to record the refund anyway.
    }
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      refundedKes: order.totalKes,
      refundReason: parsed.data.reason,
    },
  });

  // Reverse vendor ledger entries.
  try {
    await debitVendorsForRefund(order.id);
  } catch (err) {
    log.error("ledger debit failed", { orderId: order.id, err: String(err) });
  }

  if (order.user.email) {
    sendRefundEmail({
      to: order.user.email,
      name: order.user.name,
      orderNumber: order.orderNumber,
      amountKes: order.totalKes,
      reason: parsed.data.reason,
    }).catch((err) => log.error("refund email failed", { err: String(err) }));
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/account/orders");
}

const cancelSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(3).max(500),
});

export async function cancelOrderAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/orders");
  const parsed = cancelSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return;

  const order = await db.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) return;
  if (order.status === "CANCELLED" || order.status === "REFUNDED") return;

  await db.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({
      where: { orderId: order.id },
      select: { productId: true, quantity: true, fulfillmentStatus: true },
    });
    // Restock anything that hasn't shipped yet.
    for (const it of items) {
      if (it.fulfillmentStatus === "PENDING" || it.fulfillmentStatus === "FULFILLING") {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.quantity } },
        });
      }
    }
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: parsed.data.reason,
      },
    });
  });
  revalidatePath("/admin/orders");
}

// ─── Coupons ──────────────────────────────────────────────────────────────

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(40)
    .transform((v) => v.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  /** For PERCENT: integer percentage 1–100. For FIXED: KES integer. */
  value: z.coerce.number().int().positive(),
  minSubtotalKes: z.coerce.number().int().min(0).default(0),
  maxDiscountKes: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().positive().nullable(),
  ),
  vendorId: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  maxUses: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().positive().nullable(),
  ),
  perUserLimit: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().positive().nullable(),
  ),
  expiresAt: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? new Date(v) : null)),
  isActive: z
    .union([z.literal("on"), z.literal("true"), z.string()])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export async function createCouponAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  await requireRole("ADMIN", "/admin/coupons");

  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minSubtotalKes: formData.get("minSubtotalKes") ?? "0",
    maxDiscountKes: formData.get("maxDiscountKes"),
    vendorId: formData.get("vendorId") ?? undefined,
    maxUses: formData.get("maxUses"),
    perUserLimit: formData.get("perUserLimit"),
    expiresAt: formData.get("expiresAt") ?? undefined,
    isActive: formData.get("isActive") ?? "on",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.coupon.findUnique({
    where: { code: parsed.data.code },
    select: { id: true },
  });
  if (existing) {
    return { fieldErrors: { code: ["A coupon with that code already exists"] } };
  }

  // For PERCENT, store as basis points: e.g. user enters 10 → store 1000.
  const value =
    parsed.data.type === "PERCENT"
      ? Math.min(10000, parsed.data.value * 100)
      : parsed.data.value;

  await db.coupon.create({
    data: {
      code: parsed.data.code,
      type: parsed.data.type,
      value,
      minSubtotalKes: parsed.data.minSubtotalKes,
      maxDiscountKes: parsed.data.maxDiscountKes ?? null,
      vendorId: parsed.data.vendorId ?? null,
      maxUses: parsed.data.maxUses ?? null,
      perUserLimit: parsed.data.perUserLimit ?? null,
      expiresAt: parsed.data.expiresAt,
      isActive: parsed.data.isActive ?? true,
    },
  });

  revalidatePath("/admin/coupons");
  return { success: "Coupon created." };
}

export async function toggleCouponAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/coupons");
  const id = String(formData.get("id"));
  if (!id) return;
  const c = await db.coupon.findUnique({ where: { id }, select: { isActive: true } });
  if (!c) return;
  await db.coupon.update({ where: { id }, data: { isActive: !c.isActive } });
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/coupons");
  const id = String(formData.get("id"));
  if (!id) return;
  const used = await db.couponRedemption.count({ where: { couponId: id } });
  if (used > 0) {
    // Don't delete history — just deactivate.
    await db.coupon.update({ where: { id }, data: { isActive: false } });
  } else {
    await db.coupon.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/admin/coupons");
}

// ─── Review moderation ────────────────────────────────────────────────────

export async function flagReviewAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/reviews");
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!id) return;
  await db.review.update({
    where: { id },
    data: { isFlagged: true, flagReason: reason },
  });
  revalidatePath("/admin/reviews");
}

export async function hideReviewAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/reviews");
  const id = String(formData.get("id"));
  if (!id) return;
  await db.review.update({ where: { id }, data: { isHidden: true } });
  revalidatePath("/admin/reviews");
}

export async function unhideReviewAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/reviews");
  const id = String(formData.get("id"));
  if (!id) return;
  await db.review.update({
    where: { id },
    data: { isHidden: false, isFlagged: false, flagReason: null },
  });
  revalidatePath("/admin/reviews");
}

export async function deleteReviewAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/reviews");
  const id = String(formData.get("id"));
  if (!id) return;
  await db.review.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/reviews");
}

// ─── Vendor payouts ───────────────────────────────────────────────────────

const payoutSchema = z.object({
  vendorId: z.string().min(1),
  method: z.enum(["MPESA", "BANK"]),
  destinationLabel: z.string().trim().min(2).max(200),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Create a payout for the vendor's full unsettled balance and link all open
 * ledger entries to it. The actual money transfer is operator-driven (B2C
 * M-Pesa or bank transfer outside the platform); this just records it.
 */
export async function createVendorPayoutAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN", "/admin/vendors");

  const parsed = payoutSchema.safeParse({
    vendorId: formData.get("vendorId"),
    method: formData.get("method"),
    destinationLabel: formData.get("destinationLabel"),
    reference: formData.get("reference") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;

  const balance = await vendorPayableKes(parsed.data.vendorId);
  if (balance <= 0) return;

  await db.$transaction(async (tx) => {
    const payout = await tx.vendorPayout.create({
      data: {
        vendorId: parsed.data.vendorId,
        amountKes: balance,
        method: parsed.data.method,
        destinationLabel: parsed.data.destinationLabel,
        reference: parsed.data.reference,
        notes: parsed.data.notes,
        status: "PAID",
        settledAt: new Date(),
      },
    });
    await tx.vendorLedgerEntry.updateMany({
      where: {
        vendorId: parsed.data.vendorId,
        payoutId: null,
        type: { in: ["SALE_CREDIT", "REFUND_DEBIT", "ADJUSTMENT"] },
      },
      data: { payoutId: payout.id },
    });
  });

  revalidatePath("/admin/vendors");
}

// ─── User role management ─────────────────────────────────────────────────

const setUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

export async function setUserRoleAction(
  formData: FormData,
): Promise<FormResult> {
  await requireRole("ADMIN", "/admin/users");

  const parsed = setUserRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }
  const { userId, role } = parsed.data;

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  if (!target) return { error: "User not found" };
  if (target.role === role) return null;

  // Refuse any change that would leave the system with zero ADMINs.
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const remaining = await db.user.count({
      where: { role: "ADMIN", id: { not: userId } },
    });
    if (remaining === 0) {
      return { error: "Cannot demote the last admin" };
    }
  }

  await db.user.update({ where: { id: userId }, data: { role } });
  log.info("user role changed", { userId, from: target.role, to: role });
  revalidatePath("/admin/users");
  return { success: `Role updated to ${role}` };
}
