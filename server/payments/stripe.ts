import "server-only";
import { env } from "@/server/env";

/**
 * Create a Stripe Checkout session.
 *
 * Real integration steps:
 *   1. `import Stripe from "stripe"` and instantiate with STRIPE_SECRET_KEY
 *   2. Call stripe.checkout.sessions.create({
 *        mode: "payment",
 *        line_items: [{ price_data: { currency: "kes", unit_amount: amountKes,
 *          product_data: { name: `SafariCart order ${orderNumber}` } },
 *          quantity: 1 }],
 *        success_url, cancel_url,
 *        client_reference_id: orderNumber,
 *      })
 *   3. Redirect to session.url; on success_url, verify with the webhook
 *      (POST /api/webhooks/stripe) signed by STRIPE_WEBHOOK_SECRET, then
 *      mark Order.status = PAID, paidAt = checkout.session.completed time.
 *
 * Env:    STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 *         NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (client-side)
 * Docs:   https://stripe.com/docs/checkout/quickstart
 */
export async function createStripeCheckoutSession(opts: {
  orderNumber: string;
  amountKes: number;
}): Promise<
  | { ok: true; reference: string; redirectUrl: string | null }
  | { ok: false; reason: string }
> {
  if (!env.STRIPE_SECRET_KEY) {
    console.warn(
      "[stripe] STRIPE_SECRET_KEY not set — using stub. Set it in .env to enable.",
    );
    return {
      ok: true,
      reference: `STRP-STUB-${Date.now()}`,
      redirectUrl: null,
    };
  }

  // TODO: implement real Stripe Checkout session creation
  console.log("[stripe] would create checkout session", opts);
  return {
    ok: true,
    reference: `STRP-STUB-${Date.now()}`,
    redirectUrl: null,
  };
}
