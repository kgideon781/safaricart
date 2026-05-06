import "server-only";
import { db } from "@/server/db";

export async function getOrderByNumberForUser(
  orderNumber: string,
  userId: string,
) {
  return db.order.findFirst({
    where: { orderNumber, userId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          vendor: { select: { slug: true, name: true } },
        },
      },
    },
  });
}
