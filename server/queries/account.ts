import "server-only";
import { db } from "@/server/db";

export async function getUserProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getUserAddresses(userId: string) {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function getAddressById(userId: string, addressId: string) {
  return db.address.findFirst({
    where: { id: addressId, userId },
  });
}

export async function getUserOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { placedAt: "desc" },
    include: {
      items: {
        select: {
          id: true,
          productTitle: true,
          productImage: true,
          quantity: true,
        },
      },
    },
  });
}
