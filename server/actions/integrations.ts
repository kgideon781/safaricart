"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { wrapSecrets, unwrapSecrets } from "@/server/crypto";
import {
  type IntegrationScope,
  INTEGRATION_SCOPES,
  getIntegrationStatus,
} from "@/server/integrations";
import { testMpesaConnection } from "@/server/payments/mpesa";
import { testStripeConnection } from "@/server/payments/stripe";
import { testPaystackConnection } from "@/server/payments/paystack";
import { testSmtpConnection } from "@/server/email/transport";
import { testCloudinaryConnection } from "@/server/cloudinary";
import { logger } from "@/server/log";
import type { FormResult } from "@/server/actions/account";

const log = logger("integrations.action");

const SCOPE_VALUES = INTEGRATION_SCOPES as readonly IntegrationScope[];

/**
 * Per-scope schemas for the public + secret fields. Each field is optional
 * on input — the form submits only fields the operator wants to change.
 *
 * Empty strings are treated as "leave unchanged" (we'll merge with current
 * row). Use a dedicated "clear" toggle if/when we need to wipe a field.
 */
const PUBLIC_SCHEMAS: Record<IntegrationScope, z.ZodTypeAny> = {
  mpesa: z.object({
    shortcode: z.string().trim().max(20).optional(),
    callbackUrl: z
      .union([z.string().url(), z.literal("")])
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
  }),
  stripe: z.object({
    publishableKey: z.string().trim().max(200).optional(),
  }),
  paystack: z.object({
    publicKey: z.string().trim().max(200).optional(),
  }),
  smtp: z.object({
    host: z.string().trim().max(200).optional(),
    port: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === "") return undefined;
        const n = Number(v);
        return Number.isInteger(n) && n > 0 ? n : undefined;
      }),
    secure: z
      .union([z.literal("on"), z.literal("true"), z.string()])
      .optional()
      .transform((v) => v === "on" || v === "true"),
    user: z.string().trim().max(200).optional(),
    from: z.string().trim().max(200).optional(),
    fromSystem: z.string().trim().max(200).optional(),
    fromOrders: z.string().trim().max(200).optional(),
    fromSupport: z.string().trim().max(200).optional(),
    fromSales: z.string().trim().max(200).optional(),
  }),
  cloudinary: z.object({
    cloudName: z.string().trim().max(100).optional(),
    uploadFolder: z.string().trim().max(100).optional(),
  }),
};

// Always .trim() secrets — pasted credentials frequently carry leading or
// trailing whitespace, which silently breaks signature-based auth (Cloudinary,
// HMAC, etc.) with confusing "credential mismatch" errors. No real API key
// has meaningful whitespace.
const trimmed = z.string().trim().optional();
const SECRET_SCHEMAS: Record<IntegrationScope, z.ZodTypeAny> = {
  mpesa: z.object({
    consumerKey: trimmed,
    consumerSecret: trimmed,
    passkey: trimmed,
  }),
  stripe: z.object({
    secretKey: trimmed,
    webhookSecret: trimmed,
  }),
  paystack: z.object({
    secretKey: trimmed,
  }),
  smtp: z.object({
    pass: trimmed,
  }),
  cloudinary: z.object({
    apiKey: trimmed,
    apiSecret: trimmed,
  }),
};

function fdToObject(formData: FormData, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = formData.get(k);
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function parseScope(formData: FormData): IntegrationScope | null {
  const raw = String(formData.get("scope") ?? "");
  return (SCOPE_VALUES as readonly string[]).includes(raw)
    ? (raw as IntegrationScope)
    : null;
}

/**
 * Save (and optionally enable) an integration. Strategy:
 *   1. Validate posted public + secret fields against per-scope schemas.
 *   2. Merge with the existing row — empty strings mean "don't change".
 *   3. Re-encrypt the merged secrets blob and persist.
 *
 * Toggling enabled/testMode is handled by `toggleIntegrationAction` so the
 * save form doesn't accidentally flip the switch on every keystroke.
 */
export async function saveIntegrationAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const session = await requireRole("ADMIN", "/admin/integrations");

  const scope = parseScope(formData);
  if (!scope) return { error: "Unknown integration" };

  const publicSchema = PUBLIC_SCHEMAS[scope];
  const secretSchema = SECRET_SCHEMAS[scope];
  // Reflect each scope's known keys to know what the form should be carrying.
  const publicKeys = Object.keys(
    (publicSchema as unknown as { shape: Record<string, unknown> }).shape ?? {},
  );
  const secretKeys = Object.keys(
    (secretSchema as unknown as { shape: Record<string, unknown> }).shape ?? {},
  );

  const publicParsed = publicSchema.safeParse(fdToObject(formData, publicKeys));
  if (!publicParsed.success) {
    return { fieldErrors: publicParsed.error.flatten().fieldErrors };
  }
  const secretParsed = secretSchema.safeParse(fdToObject(formData, secretKeys));
  if (!secretParsed.success) {
    return { fieldErrors: secretParsed.error.flatten().fieldErrors };
  }

  const incomingSecrets = secretParsed.data as Record<string, string | undefined>;

  // Load current state to merge.
  const current = await db.integration.findUnique({ where: { scope } });

  const mergedPublic: Record<string, unknown> = {
    ...(((current?.publicConfig ?? {}) as Record<string, unknown>) ?? {}),
  };
  for (const [k, v] of Object.entries(
    publicParsed.data as Record<string, unknown>,
  )) {
    if (v === undefined) continue;
    // Empty strings clear the value
    if (v === "") delete mergedPublic[k];
    else mergedPublic[k] = v;
  }

  // Read current secrets (if any) so we can selectively merge.
  let mergedSecrets: Record<string, string> = {};
  if (current?.secretsCipher) {
    try {
      mergedSecrets = unwrapSecrets<Record<string, string>>(current.secretsCipher);
    } catch (err) {
      log.warn("could not read existing secrets — overwriting", {
        scope,
        err: String(err),
      });
      mergedSecrets = {};
    }
  }
  for (const [k, v] of Object.entries(incomingSecrets)) {
    if (v === undefined) continue;
    if (v === "") delete mergedSecrets[k];
    else mergedSecrets[k] = v;
  }

  // wrapSecrets encrypts when SETTINGS_ENCRYPTION_KEY is set; otherwise stores
  // plaintext (base64-encoded JSON) so the admin UI is usable out of the box.
  const secretsCipher =
    Object.keys(mergedSecrets).length > 0 ? wrapSecrets(mergedSecrets) : null;

  // Auto-activate when secrets actually got saved. Saving a credential and
  // having the integration stay inert behind a separate "Active" switch is
  // confusing — the toggle is still there if you want to disable, but the
  // default "save = use these now" matches user expectation.
  const willHaveSecrets = secretsCipher !== null;

  const publicJson = mergedPublic as Prisma.InputJsonValue;
  await db.integration.upsert({
    where: { scope },
    create: {
      scope,
      enabled: willHaveSecrets,
      testMode: scope === "mpesa" || scope === "stripe" || scope === "paystack",
      publicConfig: publicJson,
      secretsCipher,
      updatedBy: session.user.id,
    },
    update: {
      // Only force-enable on update if currently disabled and we now have
      // secrets — don't override an explicit "off" toggle if the operator
      // had already turned it off and is just editing public config.
      ...(willHaveSecrets && current && !current.enabled
        ? { enabled: true }
        : {}),
      publicConfig: publicJson,
      secretsCipher,
      updatedBy: session.user.id,
    },
  });

  revalidatePath("/admin/integrations");
  return { success: "Settings saved." };
}

const toggleSchema = z.object({
  scope: z.enum(SCOPE_VALUES as unknown as [IntegrationScope, ...IntegrationScope[]]),
  enabled: z.union([z.literal("on"), z.literal("true"), z.string()]).optional(),
  testMode: z.union([z.literal("on"), z.literal("true"), z.string()]).optional(),
});

export async function toggleIntegrationAction(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN", "/admin/integrations");
  const parsed = toggleSchema.safeParse({
    scope: formData.get("scope"),
    enabled: formData.get("enabled") ?? undefined,
    testMode: formData.get("testMode") ?? undefined,
  });
  if (!parsed.success) return;

  const enabled = parsed.data.enabled === "on" || parsed.data.enabled === "true";
  const testMode = parsed.data.testMode === "on" || parsed.data.testMode === "true";

  await db.integration.upsert({
    where: { scope: parsed.data.scope },
    create: {
      scope: parsed.data.scope,
      enabled,
      testMode,
      publicConfig: {},
      updatedBy: session.user.id,
    },
    update: {
      enabled,
      testMode,
      updatedBy: session.user.id,
    },
  });

  revalidatePath("/admin/integrations");
}

/**
 * Smoke-test the credentials currently stored for a scope by calling the
 * provider's API. Reads from the resolver, so it tests whatever the
 * effective config is (DB if a row exists, else env).
 */
export async function testIntegrationAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  await requireRole("ADMIN", "/admin/integrations");
  const scope = parseScope(formData);
  if (!scope) return { error: "Unknown integration" };

  // We pull the effective config through the resolver's status helper so the
  // test reflects what production calls would actually use.
  const status = await getIntegrationStatus(scope);

  // For testing, we need access to the actual secret values. The status
  // helper returns hints only, not raw secrets — re-read for the test.
  const row = await db.integration.findUnique({ where: { scope } });
  let dbSecrets: Record<string, string> = {};
  if (row?.secretsCipher) {
    try {
      dbSecrets = unwrapSecrets<Record<string, string>>(row.secretsCipher);
    } catch {
      dbSecrets = {};
    }
  }

  switch (scope) {
    case "mpesa": {
      const { env } = await import("@/server/env");
      const consumerKey = dbSecrets.consumerKey || env.MPESA_CONSUMER_KEY;
      const consumerSecret = dbSecrets.consumerSecret || env.MPESA_CONSUMER_SECRET;
      if (!consumerKey || !consumerSecret) {
        return { error: "Add a consumer key + secret first." };
      }
      const result = await testMpesaConnection({
        consumerKey,
        consumerSecret,
        testMode: status.testMode,
      });
      return result.ok
        ? { success: "M-Pesa Daraja credentials accepted." }
        : { error: `M-Pesa rejected the credentials: ${result.reason}` };
    }
    case "stripe": {
      const { env } = await import("@/server/env");
      const secretKey = dbSecrets.secretKey || env.STRIPE_SECRET_KEY;
      if (!secretKey) return { error: "Add a Stripe secret key first." };
      const result = await testStripeConnection({ secretKey });
      return result.ok
        ? {
            success: `Stripe credentials accepted (${result.testMode ? "test" : "live"} mode).`,
          }
        : { error: `Stripe rejected the credentials: ${result.reason}` };
    }
    case "paystack": {
      const { env } = await import("@/server/env");
      const secretKey = dbSecrets.secretKey || env.PAYSTACK_SECRET_KEY;
      if (!secretKey) return { error: "Add a Paystack secret key first." };
      const result = await testPaystackConnection({ secretKey });
      return result.ok
        ? {
            success: `Paystack credentials accepted (${result.testMode ? "test" : "live"} mode).`,
          }
        : { error: `Paystack rejected the credentials: ${result.reason}` };
    }
    case "smtp": {
      const { env } = await import("@/server/env");
      const cfg = (row?.publicConfig as Record<string, unknown>) ?? {};
      const host = (cfg.host as string) || env.SMTP_HOST;
      const port =
        (typeof cfg.port === "number"
          ? cfg.port
          : typeof cfg.port === "string"
            ? Number(cfg.port)
            : null) ||
        env.SMTP_PORT ||
        587;
      const secure = Boolean(cfg.secure ?? env.SMTP_SECURE);
      const user = (cfg.user as string) || env.SMTP_USER;
      const pass = dbSecrets.pass || env.SMTP_PASS;
      if (!host || !user || !pass) return { error: "Add host, user, and password first." };
      const result = await testSmtpConnection({ host, port, secure, user, pass });
      return result.ok
        ? { success: "SMTP server accepted the credentials." }
        : { error: `SMTP rejected the credentials: ${result.reason}` };
    }
    case "cloudinary": {
      const { env } = await import("@/server/env");
      const cfg = (row?.publicConfig as Record<string, unknown>) ?? {};
      const cloudName = (cfg.cloudName as string) || env.CLOUDINARY_CLOUD_NAME;
      const apiKey = dbSecrets.apiKey || env.CLOUDINARY_API_KEY;
      const apiSecret = dbSecrets.apiSecret || env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) {
        return { error: "Add cloud name, API key and secret first." };
      }
      const result = await testCloudinaryConnection({ cloudName, apiKey, apiSecret });
      return result.ok
        ? { success: "Cloudinary credentials accepted." }
        : { error: `Cloudinary rejected the credentials: ${result.reason}` };
    }
  }
}
