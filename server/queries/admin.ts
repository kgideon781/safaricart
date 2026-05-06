import "server-only";
import { db } from "@/server/db";

export async function getAdminStats() {
  const [
    userCount,
    vendorCount,
    pendingVendorCount,
    productCount,
    orderCount,
    revenueAgg,
  ] = await Promise.all([
    db.user.count(),
    db.vendor.count(),
    db.vendor.count({ where: { status: "PENDING" } }),
    db.product.count(),
    db.order.count(),
    db.order.aggregate({
      where: { status: { in: ["PAID", "FULFILLING", "SHIPPED", "DELIVERED"] } },
      _sum: { totalKes: true },
    }),
  ]);
  return {
    userCount,
    vendorCount,
    pendingVendorCount,
    productCount,
    orderCount,
    grossRevenueKes: revenueAgg._sum.totalKes ?? 0,
  };
}

export async function getAllUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      vendor: { select: { slug: true, status: true } },
    },
  });
}

export async function getAllVendors() {
  return db.vendor.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { email: true } },
      _count: { select: { products: true } },
    },
  });
}

export async function getAllProducts() {
  return db.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      vendor: { select: { slug: true, name: true } },
      category: { select: { name: true } },
    },
  });
}

export async function getAllOrders() {
  return db.order.findMany({
    orderBy: { placedAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
      _count: { select: { items: true } },
    },
  });
}

export async function getAllCategories() {
  return db.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: {
      _count: { select: { products: true } },
      parent: { select: { name: true } },
    },
  });
}
