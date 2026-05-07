import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { logger } from "@/server/log";
import { creditVendorsForOrder } from "@/server/payouts";
import { sendOrderConfirmationEmails } from "@/server/email/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = logger("mpesa.webhook");

// Daraja STK callback shape:
// {
//   "Body": {
//     "stkCallback": {
//       "MerchantRequestID": "...",
//       "CheckoutRequestID": "...",
//       "ResultCode": 0,
//       "ResultDesc": "...",
//       "CallbackMetadata": { "Item": [{ "Name": "Amount", "Value": 1 }, ...] }
//     }
//   }
// }
type StkCallbackItem = { Name: string; Value?: string | number };
type StkCallback = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode?: number;
  ResultDesc?: string;
  CallbackMetadata?: { Item?: StkCallbackItem[] };
};

function pickItem(items: StkCallbackItem[] | undefined, name: string) {
  return items?.find((i) => i.Name === name)?.Value;
}

export async function POST(request: NextRequest) {
  let payload: { Body?: { stkCallback?: StkCallback } };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" }, { status: 200 });
  }

  const cb = payload.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) {
    log.warn("missing CheckoutRequestID", { payload });
    // Always 200 — Safaricom retries non-200 indefinitely.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const txn = await db.mpesaTransaction.findUnique({
    where: { checkoutRequestId: cb.CheckoutRequestID },
    include: { order: true },
  });
  if (!txn) {
    log.warn("unknown CheckoutRequestID", { checkoutRequestId: cb.CheckoutRequestID });
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // Idempotent: if we've already finalised this transaction, no-op.
  if (txn.status !== "PENDING") {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const items = cb.CallbackMetadata?.Item ?? [];
  const success = cb.ResultCode === 0;
  const receipt = pickItem(items, "MpesaReceiptNumber");
  const amount = pickItem(items, "Amount");
  const txDate = pickItem(items, "TransactionDate");

  let transactionDate: Date | null = null;
  if (typeof txDate === "number" || (typeof txDate === "string" && /^\d{14}$/.test(txDate))) {
    const s = String(txDate);
    transactionDate = new Date(
      `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}+03:00`,
    );
  }

  await db.$transaction(async (tx) => {
    await tx.mpesaTransaction.update({
      where: { id: txn.id },
      data: {
        status: success ? "SUCCESS" : "FAILED",
        resultCode: cb.ResultCode ?? null,
        resultDesc: cb.ResultDesc ?? null,
        mpesaReceiptNumber: typeof receipt === "string" ? receipt : null,
        transactionDate,
        rawCallback: payload as never,
      },
    });

    if (success && txn.order.status === "AWAITING_PAYMENT") {
      await tx.order.update({
        where: { id: txn.orderId },
        data: {
          status: "PAID",
          paidAt: transactionDate ?? new Date(),
          paymentReference:
            typeof receipt === "string" ? receipt : txn.order.paymentReference,
        },
      });
    }
  });

  if (success) {
    log.info("payment confirmed", {
      orderNumber: txn.order.orderNumber,
      receipt,
      amount,
    });
    // Side-effects after the DB transaction (so failures don't roll back payment).
    try {
      await creditVendorsForOrder(txn.orderId);
    } catch (err) {
      log.error("ledger credit failed", { orderId: txn.orderId, err: String(err) });
    }
    try {
      await sendOrderConfirmationEmails(txn.orderId);
    } catch (err) {
      log.error("order email failed", { orderId: txn.orderId, err: String(err) });
    }
  } else {
    log.info("payment failed", {
      orderNumber: txn.order.orderNumber,
      resultDesc: cb.ResultDesc,
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
