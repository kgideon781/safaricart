import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeForWebhook } from "@/server/payments/stripe";
import { db } from "@/server/db";
import { logger } from "@/server/log";
import { creditVendorsForOrder } from "@/server/payouts";
import { sendOrderConfirmationEmails } from "@/server/email/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = logger("stripe.webhook");

export async function POST(request: NextRequest) {
  const ctx = await getStripeForWebhook();
  if (!ctx) {
    log.warn("Stripe webhook not configured — rejecting");
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 500 });
  }
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  // Stripe signature verification needs the raw bytes — not parsed JSON.
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = ctx.stripe.webhooks.constructEvent(raw, sig, ctx.webhookSecret);
  } catch (err) {
    log.warn("signature verification failed", { err: String(err) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSessionPaid(session);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSessionFailed(session);
        break;
      }
      case "charge.refunded": {
        // Best-effort: mark order REFUNDED if we can match by payment_intent.
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }
      default:
        // Acknowledge but don't process — Stripe expects a 2xx for events
        // we don't care about, otherwise it will keep retrying.
        break;
    }
  } catch (err) {
    log.error("handler failed", { type: event.type, err: String(err) });
    // Returning 500 prompts a retry. For idempotent handlers this is fine.
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSessionPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) {
    log.warn("session missing orderId", { sessionId: session.id });
    return;
  }
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) {
    log.warn("order not found", { orderId });
    return;
  }
  if (order.status === "PAID") return; // already processed

  if (session.payment_status !== "paid") return;

  await db.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentReference:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? session.id),
    },
  });

  log.info("order paid via Stripe", { orderId, sessionId: session.id });

  try {
    await creditVendorsForOrder(orderId);
  } catch (err) {
    log.error("ledger credit failed", { orderId, err: String(err) });
  }
  try {
    await sendOrderConfirmationEmails(orderId);
  } catch (err) {
    log.error("order email failed", { orderId, err: String(err) });
  }
}

async function handleSessionFailed(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) return;
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "AWAITING_PAYMENT") return;

  // Restock and cancel — payment failed or session expired.
  await db.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });
    for (const it of items) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { increment: it.quantity } },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelReason: "Stripe payment did not complete" },
    });
  });
  log.info("order cancelled (Stripe)", { orderId });
}

async function handleRefund(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!piId) return;
  const order = await db.order.findFirst({ where: { paymentReference: piId } });
  if (!order) return;
  if (order.status === "REFUNDED") return;

  await db.order.update({
    where: { id: order.id },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      refundedKes: Math.round((charge.amount_refunded ?? 0)), // KES has no cents
      refundReason: "Refunded via Stripe",
    },
  });

  // Note: vendor ledger reversal is handled by the admin refund action so the
  // operator has explicit control. Stripe webhook only updates the order row.
  log.info("order marked refunded via Stripe", { orderId: order.id });
}
