import "server-only";
import { logger } from "@/server/log";
import { publicAppUrl } from "@/server/env";
import { getPaystackConfig } from "@/server/integrations";

const log = logger("paystack");

/**
 * Initiate a Paystack transaction.
 *
 * Reads creds from `getPaystackConfig()` — admin-stored values via
 * /admin/integrations override env, so the user can paste live creds and
 * flip the toggle without redeploying.
 *
 * Paystack expects `amount` in kobo/cents. KES is supported with a 100x
 * multiplier (1 KES = 100 sub-units in Paystack's API).
 *
 * Docs: https://paystack.com/docs/api/transaction
 */
export async function initiatePaystackTransaction(opts: {
  orderNumber: string;
  amountKes: number;
  email: string;
}): Promise<
  | { ok: true; reference: string; redirectUrl: string | null }
  | { ok: false; reason: string }
> {
  const { config } = await getPaystackConfig();
  if (!config.secretKey) {
    log.warn("Paystack not configured", { orderNumber: opts.orderNumber });
    return { ok: false, reason: "Card payments via Paystack are not available right now." };
  }

  const baseUrl = publicAppUrl().replace(/\/$/, "");
  const body = {
    email: opts.email,
    amount: opts.amountKes * 100,
    currency: "KES",
    reference: opts.orderNumber,
    callback_url: `${baseUrl}/checkout/success/${opts.orderNumber}`,
    metadata: { orderNumber: opts.orderNumber },
  };

  let res: Response;
  try {
    res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    log.error("network error", { err: String(err) });
    return { ok: false, reason: "Network error reaching Paystack. Please try again." };
  }

  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; reference?: string };
  };
  if (!res.ok || !json.status || !json.data?.authorization_url || !json.data.reference) {
    log.warn("init rejected", { status: res.status, response: json });
    return {
      ok: false,
      reason: json.message || "Paystack rejected the request.",
    };
  }

  log.info("transaction initialized", {
    orderNumber: opts.orderNumber,
    reference: json.data.reference,
  });
  return {
    ok: true,
    reference: json.data.reference,
    redirectUrl: json.data.authorization_url,
  };
}

/** Used by /admin/integrations to validate credentials. */
export async function testPaystackConnection(opts: {
  secretKey: string;
}): Promise<{ ok: true; testMode: boolean } | { ok: false; reason: string }> {
  try {
    const res = await fetch("https://api.paystack.co/balance", {
      headers: { Authorization: `Bearer ${opts.secretKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, reason: `Paystack returned ${res.status}` };
    }
    return { ok: true, testMode: opts.secretKey.startsWith("sk_test_") };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Network error",
    };
  }
}
