import "server-only";
import { db } from "@/server/db";
import type { Coupon } from "@prisma/client";

export type CouponEvaluation =
  | { ok: true; coupon: Coupon; discountKes: number }
  | { ok: false; reason: string };

/**
 * Look up a coupon by code and validate it for the given user + cart context.
 * Returns the discount amount that should be applied (does not modify any data).
 */
export async function evaluateCoupon(opts: {
  code: string;
  userId: string;
  /** Cart subtotal in KES, before discount, after vendor scoping. */
  subtotalKes: number;
  /** Subtotals per vendor — used to scope vendor-specific coupons. */
  perVendorSubtotalKes?: Record<string, number>;
}): Promise<CouponEvaluation> {
  const code = opts.code.trim().toUpperCase();
  if (!code) return { ok: false, reason: "Enter a coupon code" };

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) {
    return { ok: false, reason: "That code isn't valid" };
  }
  const now = Date.now();
  if (coupon.startsAt && coupon.startsAt.getTime() > now) {
    return { ok: false, reason: "This coupon isn't active yet" };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now) {
    return { ok: false, reason: "This coupon has expired" };
  }

  // Eligible subtotal: vendor-scoped or full cart.
  const eligible =
    coupon.vendorId && opts.perVendorSubtotalKes
      ? (opts.perVendorSubtotalKes[coupon.vendorId] ?? 0)
      : opts.subtotalKes;
  if (eligible <= 0) {
    return { ok: false, reason: "Your cart has no items eligible for this coupon" };
  }
  if (coupon.minSubtotalKes > 0 && eligible < coupon.minSubtotalKes) {
    return {
      ok: false,
      reason: `Spend at least KES ${coupon.minSubtotalKes.toLocaleString("en-KE")} to use this code`,
    };
  }

  if (coupon.maxUses != null) {
    const used = await db.couponRedemption.count({ where: { couponId: coupon.id } });
    if (used >= coupon.maxUses) {
      return { ok: false, reason: "This coupon has reached its limit" };
    }
  }
  if (coupon.perUserLimit != null) {
    const usedByUser = await db.couponRedemption.count({
      where: { couponId: coupon.id, userId: opts.userId },
    });
    if (usedByUser >= coupon.perUserLimit) {
      return { ok: false, reason: "You've already used this coupon" };
    }
  }

  let discount = 0;
  if (coupon.type === "PERCENT") {
    discount = Math.floor((eligible * coupon.value) / 10000);
    if (coupon.maxDiscountKes != null && discount > coupon.maxDiscountKes) {
      discount = coupon.maxDiscountKes;
    }
  } else {
    discount = Math.min(coupon.value, eligible);
  }

  if (discount <= 0) return { ok: false, reason: "This coupon yields no discount" };
  return { ok: true, coupon, discountKes: discount };
}
