import "server-only";
import { env } from "@/server/env";

/**
 * Initiate an M-Pesa STK push (Daraja Lipa Na M-Pesa Online).
 *
 * Real integration steps:
 *   1. POST to /oauth/v1/generate?grant_type=client_credentials with
 *      Basic auth from MPESA_CONSUMER_KEY:MPESA_CONSUMER_SECRET → access_token
 *   2. POST to /mpesa/stkpush/v1/processrequest with:
 *        BusinessShortCode: MPESA_SHORTCODE
 *        Password: base64(SHORTCODE + PASSKEY + timestamp)
 *        Timestamp: yyyyMMddHHmmss
 *        TransactionType: "CustomerPayBillOnline"
 *        Amount: amountKes (integer)
 *        PartyA: phoneE164 without "+", e.g. 254712345678
 *        PartyB: MPESA_SHORTCODE
 *        PhoneNumber: same as PartyA
 *        CallBackURL: MPESA_CALLBACK_URL
 *        AccountReference: orderNumber
 *        TransactionDesc: "SafariCart order"
 *   3. Persist CheckoutRequestID returned by Safaricom
 *   4. Daraja calls MPESA_CALLBACK_URL with payment result; that handler
 *      should match CheckoutRequestID → Order and set status=PAID, paidAt.
 *
 * Env:    MPESA_ENV (sandbox|production), MPESA_CONSUMER_KEY,
 *         MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY,
 *         MPESA_CALLBACK_URL
 * Docs:   https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 */
export async function initiateMpesaStkPush(opts: {
  orderNumber: string;
  amountKes: number;
  phoneE164: string;
}): Promise<{ ok: true; reference: string } | { ok: false; reason: string }> {
  if (!env.MPESA_CONSUMER_KEY || !env.MPESA_CONSUMER_SECRET || !env.MPESA_SHORTCODE) {
    console.warn(
      "[mpesa] Daraja credentials not configured — using stub. Set MPESA_* in .env to enable.",
    );
    return { ok: true, reference: `MPESA-STUB-${Date.now()}` };
  }

  // TODO: implement real Daraja STK push
  console.log("[mpesa] would initiate STK push", opts);
  return { ok: true, reference: `MPESA-STUB-${Date.now()}` };
}
