import "server-only";
import type { PaymentMethod } from "@prisma/client";
import { initiateMpesaStkPush } from "./mpesa";
import { initiatePaystackTransaction } from "./paystack";
import { createStripeCheckoutSession } from "./stripe";

export type PaymentInitOptions = {
  method: PaymentMethod;
  orderId: string;
  orderNumber: string;
  amountKes: number;
  email: string;
  phoneE164: string | null;
};

export type PaymentInitResult =
  | { ok: true; reference: string; redirectUrl: string | null }
  | { ok: false; reason: string };

/**
 * Dispatch to the right payment provider. Cash-on-delivery does not require
 * a payment provider call — the order is simply marked PENDING.
 */
export async function initiatePayment(
  opts: PaymentInitOptions,
): Promise<PaymentInitResult> {
  switch (opts.method) {
    case "CASH_ON_DELIVERY":
      return { ok: true, reference: `COD-${opts.orderNumber}`, redirectUrl: null };
    case "MPESA": {
      if (!opts.phoneE164) {
        return { ok: false, reason: "Phone number is required for M-Pesa" };
      }
      const result = await initiateMpesaStkPush({
        orderId: opts.orderId,
        orderNumber: opts.orderNumber,
        amountKes: opts.amountKes,
        phoneE164: opts.phoneE164,
      });
      if (!result.ok) return result;
      return { ok: true, reference: result.reference, redirectUrl: null };
    }
    case "PAYSTACK":
      return initiatePaystackTransaction({
        orderNumber: opts.orderNumber,
        amountKes: opts.amountKes,
        email: opts.email,
      });
    case "STRIPE":
      return createStripeCheckoutSession({
        orderId: opts.orderId,
        orderNumber: opts.orderNumber,
        amountKes: opts.amountKes,
        email: opts.email,
      });
  }
}
