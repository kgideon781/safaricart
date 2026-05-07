import "server-only";
import { db } from "@/server/db";
import { logger } from "@/server/log";
import { getMpesaConfig } from "@/server/integrations";

const log = logger("mpesa");

// Safaricom's public sandbox defaults — documented in the Daraja Postman
// collection. Used when the operator hasn't supplied a shortcode/passkey,
// so end-to-end sandbox testing works with just a consumer key/secret.
const SANDBOX_SHORTCODE = "174379";
const SANDBOX_PASSKEY =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

/** yyyyMMddHHmmss in EAT (UTC+3) — what Daraja expects. */
function darajaTimestamp(now = new Date()): string {
  const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const y = eat.getUTCFullYear();
  const m = String(eat.getUTCMonth() + 1).padStart(2, "0");
  const d = String(eat.getUTCDate()).padStart(2, "0");
  const h = String(eat.getUTCHours()).padStart(2, "0");
  const mi = String(eat.getUTCMinutes()).padStart(2, "0");
  const s = String(eat.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}${h}${mi}${s}`;
}

// OAuth tokens are keyed by consumer key — different keys (sandbox vs live,
// or before/after rotation) must not share a cache entry.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getAccessToken(opts: {
  consumerKey: string;
  consumerSecret: string;
  apiBaseUrl: string;
}): Promise<string> {
  const cached = tokenCache.get(opts.consumerKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const auth = Buffer.from(`${opts.consumerKey}:${opts.consumerSecret}`).toString(
    "base64",
  );
  const res = await fetch(
    `${opts.apiBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daraja OAuth failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: string | number;
  };
  const ttlSeconds = Number(data.expires_in) || 3500;
  tokenCache.set(opts.consumerKey, {
    token: data.access_token,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return data.access_token;
}

/** Convert +254XXXXXXXXX → 254XXXXXXXXX (Daraja drops the +). */
function darajaPhone(e164: string): string {
  return e164.replace(/^\+/, "");
}

/**
 * Initiate an M-Pesa STK push (Daraja Lipa Na M-Pesa Online).
 * Reads creds from `getMpesaConfig()` so admin-stored credentials win over env.
 */
export async function initiateMpesaStkPush(opts: {
  orderId: string;
  orderNumber: string;
  amountKes: number;
  phoneE164: string;
}): Promise<{ ok: true; reference: string } | { ok: false; reason: string }> {
  const { config } = await getMpesaConfig();

  if (!config.consumerKey || !config.consumerSecret) {
    log.warn("Daraja credentials not configured — skipping STK push", {
      orderNumber: opts.orderNumber,
    });
    return { ok: false, reason: "M-Pesa is not configured. Choose another payment method." };
  }

  const shortcode = config.shortcode || SANDBOX_SHORTCODE;
  const passkey = config.passkey || SANDBOX_PASSKEY;

  const amount = Math.max(1, Math.round(opts.amountKes));
  const phone = darajaPhone(opts.phoneE164);
  const ts = darajaTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  let token: string;
  try {
    token = await getAccessToken({
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      apiBaseUrl: config.apiBaseUrl,
    });
  } catch (err) {
    log.error("Daraja OAuth failed", { err: String(err) });
    return { ok: false, reason: "Could not reach M-Pesa right now. Please try again." };
  }

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: config.callbackUrl,
    AccountReference: opts.orderNumber.slice(0, 12),
    TransactionDesc: `SafariCart ${opts.orderNumber}`.slice(0, 13),
  };

  let res: Response;
  try {
    res = await fetch(`${config.apiBaseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    log.error("STK push network error", { err: String(err) });
    return { ok: false, reason: "Network error reaching M-Pesa. Please try again." };
  }

  const json = (await res.json().catch(() => ({}))) as {
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
    errorMessage?: string;
  };

  if (!res.ok || json.ResponseCode !== "0" || !json.CheckoutRequestID) {
    log.warn("STK push rejected", {
      status: res.status,
      orderNumber: opts.orderNumber,
      response: json,
    });
    return {
      ok: false,
      reason: json.errorMessage || json.ResponseDescription || "M-Pesa rejected the request.",
    };
  }

  await db.mpesaTransaction.create({
    data: {
      orderId: opts.orderId,
      merchantRequestId: json.MerchantRequestID,
      checkoutRequestId: json.CheckoutRequestID,
      amountKes: amount,
      phoneE164: opts.phoneE164,
      status: "PENDING",
    },
  });

  log.info("STK push initiated", {
    orderNumber: opts.orderNumber,
    checkoutRequestId: json.CheckoutRequestID,
  });

  return { ok: true, reference: json.CheckoutRequestID };
}

/** Test the credentials by requesting an OAuth token. Used by /admin/integrations. */
export async function testMpesaConnection(opts: {
  consumerKey: string;
  consumerSecret: string;
  testMode: boolean;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiBaseUrl = opts.testMode
    ? "https://sandbox.safaricom.co.ke"
    : "https://api.safaricom.co.ke";
  try {
    const auth = Buffer.from(`${opts.consumerKey}:${opts.consumerSecret}`).toString(
      "base64",
    );
    const res = await fetch(
      `${apiBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" },
    );
    if (!res.ok) {
      return { ok: false, reason: `Daraja returned ${res.status}` };
    }
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) return { ok: false, reason: "No access_token in response" };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Network error" };
  }
}
