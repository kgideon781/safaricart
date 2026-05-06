"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { PaymentMethod } from "@prisma/client";
import { db } from "@/server/db";
import { requireSession } from "@/server/auth";
import { getCart } from "@/server/cart";
import { initiatePayment } from "@/server/payments";
import { normalizeKenyanPhone } from "@/lib/kenya";
import type { FormResult } from "@/server/actions/account";

const PAYMENT_METHODS = [
  "MPESA",
  "PAYSTACK",
  "STRIPE",
  "CASH_ON_DELIVERY",
] as const satisfies readonly PaymentMethod[];

const checkoutSchema = z.object({
  addressId: z.string().min(1, "Pick a delivery address"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  mpesaPhone: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : undefined)),
});

function generateOrderNumber(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `SC-${ym}-${rand}`;
}

export async function placeOrderAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const session = await requireSession("/checkout");

  const parsed = checkoutSchema.safeParse({
    addressId: formData.get("addressId"),
    paymentMethod: formData.get("paymentMethod"),
    mpesaPhone: formData.get("mpesaPhone") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Address ownership
  const address = await db.address.findFirst({
    where: { id: parsed.data.addressId, userId: session.user.id },
  });
  if (!address) return { error: "That address no longer exists" };

  // Cart contents
  const cart = await getCart();
  if (cart.items.length === 0) return { error: "Your cart is empty" };

  // Stock check
  for (const item of cart.items) {
    if (item.quantity > item.stock) {
      return {
        error: `${item.title} only has ${item.stock} in stock — please update your cart`,
      };
    }
  }

  // M-Pesa requires a phone number
  let mpesaPhoneE164: string | null = null;
  if (parsed.data.paymentMethod === "MPESA") {
    const raw = parsed.data.mpesaPhone ?? address.recipientPhone;
    const normalized = normalizeKenyanPhone(raw);
    if (!normalized) {
      return {
        fieldErrors: {
          mpesaPhone: ["Enter a valid Kenyan mobile number for M-Pesa"],
        },
      };
    }
    mpesaPhoneE164 = normalized;
  }

  const subtotalKes = cart.subtotalKes;
  const shippingFeeKes = subtotalKes >= 5000 ? 0 : 350;
  const totalKes = subtotalKes + shippingFeeKes;

  // Pre-generate a unique order number (retry on collision)
  let orderNumber = generateOrderNumber();
  for (let i = 0; i < 5; i++) {
    const exists = await db.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    if (!exists) break;
    orderNumber = generateOrderNumber();
  }

  // Create order in a transaction: snapshot product data, decrement stock,
  // clear cart.
  let order;
  try {
    order = await db.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: cart.items.map((i) => i.productId) } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      const initialOrderStatus =
        parsed.data.paymentMethod === "CASH_ON_DELIVERY"
          ? "PENDING"
          : "AWAITING_PAYMENT";

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: initialOrderStatus,
          subtotalKes,
          shippingFeeKes,
          totalKes,
          shippingRecipientName: address.recipientName,
          shippingRecipientPhone: address.recipientPhone,
          shippingCounty: address.county,
          shippingSubCounty: address.subCounty,
          shippingStreetAddress: address.streetAddress,
          shippingLandmark: address.landmark,
          paymentMethod: parsed.data.paymentMethod,
        },
      });

      for (const item of cart.items) {
        const product = byId.get(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);

        await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: product.id,
            vendorId: product.vendorId,
            productTitle: product.title,
            productImage: product.images[0] ?? null,
            unitPriceKes: product.priceKes,
            quantity: item.quantity,
            subtotalKes: product.priceKes * item.quantity,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear the user's cart
      await tx.cartItem.deleteMany({
        where: { cart: { userId: session.user.id } },
      });

      return created;
    });
  } catch (error) {
    console.error("Order creation failed", error);
    return { error: "Could not place your order. Please try again." };
  }

  // Initiate payment (stub for now — real providers behind .env flags).
  const payment = await initiatePayment({
    method: parsed.data.paymentMethod,
    orderNumber: order.orderNumber,
    amountKes: order.totalKes,
    email: session.user.email ?? "",
    phoneE164: mpesaPhoneE164,
  });

  if (payment.ok) {
    await db.order.update({
      where: { id: order.id },
      data: { paymentReference: payment.reference },
    });
    if (payment.redirectUrl) {
      // Card-redirect providers (Paystack/Stripe) hand off to a hosted page
      redirect(payment.redirectUrl);
    }
  }

  revalidatePath("/", "layout");
  redirect(`/checkout/success/${order.orderNumber}`);
}
