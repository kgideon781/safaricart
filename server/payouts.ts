import "server-only";
import { db } from "@/server/db";
import { logger } from "@/server/log";
import { notifyAdminsFirstVendorOrder } from "@/server/email/admin";

const log = logger("payouts");

/**
 * Vendor share of an item's subtotal, after platform commission.
 * commissionBps is in basis points (10000 = 100%).
 */
export function vendorShare(subtotalKes: number, commissionBps: number): {
  vendorKes: number;
  commissionKes: number;
} {
  const commission = Math.floor((subtotalKes * commissionBps) / 10000);
  return {
    vendorKes: subtotalKes - commission,
    commissionKes: commission,
  };
}

/**
 * Credit vendors for every item in a paid order. Idempotent: if a SALE_CREDIT
 * already exists for an OrderItem, we don't create another. Safe to call from
 * the M-Pesa webhook, the Stripe webhook, or a COD fulfillment trigger.
 */
export async function creditVendorsForOrder(orderId: string): Promise<void> {
  const items = await db.orderItem.findMany({
    where: { orderId },
    include: {
      vendor: { select: { id: true, commissionBps: true, name: true, slug: true } },
      order: { select: { orderNumber: true, totalKes: true } },
    },
  });

  // Track each vendor's first sale so we can notify admins once per vendor
  // even if they have multiple line items in the same order.
  const firstSaleNotifications = new Map<
    string,
    { vendorName: string; vendorSlug: string; orderNumber: string; totalKes: number }
  >();

  for (const item of items) {
    const existing = await db.vendorLedgerEntry.findFirst({
      where: { orderItemId: item.id, type: "SALE_CREDIT" },
      select: { id: true },
    });
    if (existing) continue;

    if (!firstSaleNotifications.has(item.vendorId)) {
      const priorSales = await db.vendorLedgerEntry.count({
        where: { vendorId: item.vendorId, type: "SALE_CREDIT" },
      });
      if (priorSales === 0) {
        firstSaleNotifications.set(item.vendorId, {
          vendorName: item.vendor.name,
          vendorSlug: item.vendor.slug,
          orderNumber: item.order.orderNumber,
          totalKes: item.order.totalKes,
        });
      }
    }

    const { vendorKes, commissionKes } = vendorShare(
      item.subtotalKes,
      item.vendor.commissionBps,
    );

    await db.$transaction([
      db.vendorLedgerEntry.create({
        data: {
          vendorId: item.vendorId,
          orderItemId: item.id,
          type: "SALE_CREDIT",
          amountKes: vendorKes,
          description: `Sale: ${item.productTitle} ×${item.quantity}`,
        },
      }),
      // Record the commission as a separate informational entry. It is not
      // counted toward the payable balance because vendorKes already excludes
      // it; this is just for vendor transparency.
      db.vendorLedgerEntry.create({
        data: {
          vendorId: item.vendorId,
          orderItemId: item.id,
          type: "COMMISSION_DEBIT",
          amountKes: -commissionKes,
          description: `Platform commission`,
        },
      }),
    ]);
  }

  log.info("vendor credits posted", { orderId, items: items.length });

  for (const v of firstSaleNotifications.values()) {
    notifyAdminsFirstVendorOrder(v).catch((err) =>
      log.error("first-sale notify failed", { err: String(err) }),
    );
  }
}

/**
 * Reverse vendor credit for a refunded order. Creates negative entries
 * matching prior SALE_CREDITs.
 */
export async function debitVendorsForRefund(orderId: string): Promise<void> {
  const credits = await db.vendorLedgerEntry.findMany({
    where: {
      orderItem: { orderId },
      type: "SALE_CREDIT",
    },
    include: { orderItem: { select: { productTitle: true, quantity: true } } },
  });

  for (const c of credits) {
    const already = await db.vendorLedgerEntry.findFirst({
      where: { orderItemId: c.orderItemId, type: "REFUND_DEBIT" },
      select: { id: true },
    });
    if (already) continue;

    await db.vendorLedgerEntry.create({
      data: {
        vendorId: c.vendorId,
        orderItemId: c.orderItemId,
        type: "REFUND_DEBIT",
        amountKes: -c.amountKes,
        description: `Refund: ${c.orderItem?.productTitle ?? "item"}`,
      },
    });
  }
}

/** Sum of unpaid (not yet attached to a settled payout) entries for a vendor. */
export async function vendorPayableKes(vendorId: string): Promise<number> {
  const result = await db.vendorLedgerEntry.aggregate({
    where: {
      vendorId,
      payoutId: null,
      type: { in: ["SALE_CREDIT", "REFUND_DEBIT", "ADJUSTMENT"] },
    },
    _sum: { amountKes: true },
  });
  return result._sum.amountKes ?? 0;
}
