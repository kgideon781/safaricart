import "server-only";
import { env } from "@/server/env";

/**
 * Initiate a Paystack transaction.
 *
 * Real integration steps:
 *   1. POST https://api.paystack.co/transaction/initialize
 *      Authorization: Bearer ${PAYSTACK_SECRET_KEY}
 *      Body: { email, amount: amountKes * 100, currency: "KES",
 *              reference: orderNumber, callback_url }
 *   2. Redirect customer to data.authorization_url returned by Paystack.
 *   3. Verify on success at /transaction/verify/:reference and mark
 *      Order.status = PAID.
 *
 * Env:    PAYSTACK_SECRET_KEY, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (client-side)
 * Docs:   https://paystack.com/docs/api/transaction
 */
export async function initiatePaystackTransaction(opts: {
  orderNumber: string;
  amountKes: number;
  email: string;
}): Promise<
  | { ok: true; reference: string; redirectUrl: string | null }
  | { ok: false; reason: string }
> {
  if (!env.PAYSTACK_SECRET_KEY) {
    console.warn(
      "[paystack] PAYSTACK_SECRET_KEY not set — using stub. Set it in .env to enable.",
    );
    return {
      ok: true,
      reference: `PSTK-STUB-${Date.now()}`,
      redirectUrl: null,
    };
  }

  // TODO: implement real Paystack call
  console.log("[paystack] would initialize transaction", opts);
  return {
    ok: true,
    reference: `PSTK-STUB-${Date.now()}`,
    redirectUrl: null,
  };
}
