import "server-only";
import Stripe from "stripe";
import { publicAppUrl } from "@/server/env";
import { logger } from "@/server/log";
import { getStripeConfig } from "@/server/integrations";

const log = logger("stripe");

/**
 * Build a Stripe client from the active config (DB-first, env-fallback).
 * We don't cache at module scope — admin can rotate the key and the next
 * call should pick it up immediately. SDK construction is cheap.
 */
export async function getStripeClient(): Promise<Stripe | null> {
  const { config } = await getStripeConfig();
  if (!config.secretKey) return null;
  return new Stripe(config.secretKey);
}

/** Webhook handler accessor: needs both client + webhook secret. */
export async function getStripeForWebhook(): Promise<{
  stripe: Stripe;
  webhookSecret: string;
} | null> {
  const { config } = await getStripeConfig();
  if (!config.secretKey || !config.webhookSecret) return null;
  return { stripe: new Stripe(config.secretKey), webhookSecret: config.webhookSecret };
}

/** Used by admin actions for refunds. */
export async function refundStripePaymentIntent(paymentIntentId: string): Promise<void> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("Stripe is not configured");
  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: "requested_by_customer",
  });
}

/**
 * Create a Stripe Checkout session.
 *
 * KES is a zero-decimal currency — `unit_amount` is the integer KES amount
 * directly (no cents).
 */
export async function createStripeCheckoutSession(opts: {
  orderId: string;
  orderNumber: string;
  amountKes: number;
  email?: string;
}): Promise<
  | { ok: true; reference: string; redirectUrl: string | null }
  | { ok: false; reason: string }
> {
  const stripe = await getStripeClient();
  if (!stripe) {
    log.warn("Stripe not configured — disabled");
    return { ok: false, reason: "Card payments are not available right now." };
  }

  const baseUrl = publicAppUrl().replace(/\/$/, "");
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "kes",
            unit_amount: opts.amountKes,
            product_data: { name: `SafariCart order ${opts.orderNumber}` },
          },
        },
      ],
      customer_email: opts.email || undefined,
      client_reference_id: opts.orderId,
      metadata: { orderId: opts.orderId, orderNumber: opts.orderNumber },
      success_url: `${baseUrl}/checkout/success/${opts.orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?cancelled=${encodeURIComponent(opts.orderNumber)}`,
    });

    if (!session.url) {
      return { ok: false, reason: "Stripe did not return a checkout URL." };
    }
    log.info("checkout session created", {
      orderNumber: opts.orderNumber,
      sessionId: session.id,
    });
    return { ok: true, reference: session.id, redirectUrl: session.url };
  } catch (err) {
    log.error("checkout session failed", { err: String(err) });
    return {
      ok: false,
      reason: "Could not start card payment. Please try another method.",
    };
  }
}

/** Used by /admin/integrations to validate credentials. */
export async function testStripeConnection(opts: {
  secretKey: string;
}): Promise<{ ok: true; testMode: boolean } | { ok: false; reason: string }> {
  try {
    const stripe = new Stripe(opts.secretKey);
    // balance.retrieve is cheap and confirms we have a working secret key.
    await stripe.balance.retrieve();
    return { ok: true, testMode: opts.secretKey.startsWith("sk_test_") };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe rejected the credentials";
    return { ok: false, reason: message };
  }
}
