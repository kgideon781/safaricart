import "server-only";
import { db } from "@/server/db";

export async function getVendorStats(vendorId: string) {
  const [productCount, orderItemCount, pendingItems, revenueAgg] = await Promise.all([
    db.product.count({ where: { vendorId } }),
    db.orderItem.count({ where: { vendorId } }),
    db.orderItem.count({
      where: {
        vendorId,
        fulfillmentStatus: { in: ["PENDING", "FULFILLING"] },
      },
    }),
    db.orderItem.aggregate({
      where: {
        vendorId,
        order: { status: { in: ["PAID", "FULFILLING", "SHIPPED", "DELIVERED"] } },
      },
      _sum: { subtotalKes: true },
    }),
  ]);

  return {
    productCount,
    orderItemCount,
    pendingItems,
    totalRevenueKes: revenueAgg._sum.subtotalKes ?? 0,
  };
}

export async function getVendorProducts(vendorId: string) {
  return db.product.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
    },
  });
}

export async function getVendorProduct(vendorId: string, productId: string) {
  return db.product.findFirst({
    where: { id: productId, vendorId },
  });
}

export async function getVendorOrderItems(vendorId: string) {
  return db.orderItem.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          orderNumber: true,
          status: true,
          placedAt: true,
          shippingRecipientName: true,
          shippingCounty: true,
          shippingSubCounty: true,
        },
      },
    },
  });
}
