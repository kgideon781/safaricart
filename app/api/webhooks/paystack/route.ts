import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { logger } from "@/server/log";
import { getPaystackConfig } from "@/server/integrations";
import { creditVendorsForOrder } from "@/server/payouts";
import { sendOrderConfirmationEmails } from "@/server/email/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = logger("paystack.webhook");

// Paystack signs webhook payloads with HMAC-SHA512 using the secret key.
// Header: x-paystack-signature
type PaystackEvent = {
  event: string;
  data: {
    reference?: string;
    amount?: number;
    status?: string;
    paid_at?: string;
    metadata?: { orderNumber?: string };
  };
};

export async function POST(request: NextRequest) {
  const { config } = await getPaystackConfig();
  if (!config.secretKey) {
    log.warn("Paystack not configured — rejecting");
    return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
  }

  const sig = request.headers.get("x-paystack-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await request.text();
  const expected = crypto
    .createHmac("sha512", config.secretKey)
    .update(raw)
    .digest("hex");
  // Constant-time compare; same length is required to use timingSafeEqual.
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    log.warn("signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(raw) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const reference = event.data.reference || event.data.metadata?.orderNumber;
    if (!reference) {
      log.warn("missing reference");
      return NextResponse.json({ received: true });
    }
    // We pass the orderNumber as Paystack's `reference` when initialising.
    const order = await db.order.findUnique({ where: { orderNumber: reference } });
    if (!order) {
      log.warn("unknown reference", { reference });
      return NextResponse.json({ received: true });
    }
    if (order.status === "PAID") return NextResponse.json({ received: true });

    await db.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: event.data.paid_at ? new Date(event.data.paid_at) : new Date(),
        paymentReference: reference,
      },
    });
    log.info("order paid", { orderNumber: order.orderNumber });

    creditVendorsForOrder(order.id).catch((err) =>
      log.error("ledger credit failed", { err: String(err) }),
    );
    sendOrderConfirmationEmails(order.id).catch((err) =>
      log.error("emails failed", { err: String(err) }),
    );
  }

  return NextResponse.json({ received: true });
}
