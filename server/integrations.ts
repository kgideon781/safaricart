import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/server/db";
import { env, publicAppUrl } from "@/server/env";
import { unwrapSecrets, isEncryptedAtRest } from "@/server/crypto";

/**
 * Single source of truth for runtime-configurable integration credentials.
 *
 * Resolution order:
 *   1. If an `Integration` row with `enabled = true` exists for the scope,
 *      its values win — secrets decrypted from `secretsCipher`, public
 *      values merged from `publicConfig`.
 *   2. Otherwise we fall back to environment variables (the bootstrap path).
 *
 * Each scope returns a strongly-typed config object plus an `isLive` flag
 * indicating where it came from. Callers should branch only on whether the
 * required fields are set, not on `source` — both paths produce the same
 * shape.
 */

export type IntegrationScope =
  | "mpesa"
  | "stripe"
  | "paystack"
  | "smtp"
  | "cloudinary";

export const INTEGRATION_SCOPES: IntegrationScope[] = [
  "mpesa",
  "stripe",
  "paystack",
  "smtp",
  "cloudinary",
];

type Source = "db" | "env" | "none";

type ResolveResult<T> = {
  source: Source;
  enabled: boolean;
  testMode: boolean;
  config: T;
};

// ─── Per-scope shapes ─────────────────────────────────────────────────────

export type MpesaConfig = {
  consumerKey: string | null;
  consumerSecret: string | null;
  shortcode: string | null;
  passkey: string | null;
  callbackUrl: string | null;
  apiBaseUrl: string;
};

export type StripeConfig = {
  secretKey: string | null;
  webhookSecret: string | null;
  publishableKey: string | null;
};

export type PaystackConfig = {
  secretKey: string | null;
  publicKey: string | null;
};

/**
 * Mail purpose tags select the FROM address. They map roughly to mailbox
 * aliases: system = no-reply@, orders = orders@, support = support@,
 * sales = sales@. Add new purposes here when adding a new alias.
 */
export type MailPurpose = "system" | "orders" | "support" | "sales";

export type SmtpConfig = {
  host: string | null;
  port: number | null;
  secure: boolean;
  user: string | null;
  pass: string | null;
  /** Default FROM — used when no purpose-specific FROM is set. */
  from: string;
  /** Per-purpose FROM overrides. Missing keys fall back to `from`. */
  fromByPurpose: Partial<Record<MailPurpose, string>>;
};

export type CloudinaryConfig = {
  cloudName: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  uploadFolder: string;
};

// ─── Internal: load and decrypt the DB row ────────────────────────────────

type IntegrationRow = {
  enabled: boolean;
  testMode: boolean;
  publicConfig: Record<string, unknown>;
  secrets: Record<string, unknown>;
};

/**
 * Read the DB row, decrypt secrets, and return a flattened structure.
 * Returns null if the row doesn't exist or if decryption fails (in which
 * case we log and fall back to env).
 */
async function readDbRow(scope: IntegrationScope): Promise<IntegrationRow | null> {
  const row = await db.integration.findUnique({ where: { scope } });
  if (!row) return null;
  let secrets: Record<string, unknown> = {};
  if (row.secretsCipher) {
    try {
      secrets = unwrapSecrets<Record<string, unknown>>(row.secretsCipher);
    } catch (err) {
      console.error(
        `[integrations] ${scope}: failed to unwrap secrets (key rotated?): ${String(err)}`,
      );
      return null;
    }
  }
  return {
    enabled: row.enabled,
    testMode: row.testMode,
    publicConfig: (row.publicConfig as Record<string, unknown>) ?? {},
    secrets,
  };
}

function pickString(
  src: Record<string, unknown>,
  key: string,
): string | null {
  const v = src[key];
  if (typeof v === "string" && v.length > 0) return v;
  return null;
}

function dbOrEnv(
  dbVal: string | null | undefined,
  envVal: string | undefined,
): string | null {
  if (dbVal && dbVal.length > 0) return dbVal;
  if (envVal && envVal.length > 0) return envVal;
  return null;
}

// ─── Public resolvers ──────────────────────────────────────────────────────

export async function getMpesaConfig(): Promise<ResolveResult<MpesaConfig>> {
  const row = await readDbRow("mpesa");
  const useDb = !!row?.enabled;
  const testMode = useDb ? row!.testMode : env.MPESA_ENV !== "production";

  const consumerKey = useDb
    ? pickString(row!.secrets, "consumerKey")
    : env.MPESA_CONSUMER_KEY ?? null;
  const consumerSecret = useDb
    ? pickString(row!.secrets, "consumerSecret")
    : env.MPESA_CONSUMER_SECRET ?? null;
  const passkey = useDb
    ? pickString(row!.secrets, "passkey")
    : env.MPESA_PASSKEY ?? null;
  const shortcode = useDb
    ? pickString(row!.publicConfig, "shortcode")
    : env.MPESA_SHORTCODE ?? null;
  const callbackUrl = useDb
    ? pickString(row!.publicConfig, "callbackUrl") ??
      `${publicAppUrl().replace(/\/$/, "")}/api/webhooks/mpesa`
    : env.MPESA_CALLBACK_URL ??
      `${publicAppUrl().replace(/\/$/, "")}/api/webhooks/mpesa`;

  return {
    source: useDb ? "db" : (consumerKey ? "env" : "none"),
    enabled: useDb,
    testMode,
    config: {
      consumerKey,
      consumerSecret,
      passkey,
      shortcode,
      callbackUrl,
      apiBaseUrl: testMode
        ? "https://sandbox.safaricom.co.ke"
        : "https://api.safaricom.co.ke",
    },
  };
}

export async function getStripeConfig(): Promise<ResolveResult<StripeConfig>> {
  const row = await readDbRow("stripe");
  const useDb = !!row?.enabled;

  return {
    source: useDb ? "db" : env.STRIPE_SECRET_KEY ? "env" : "none",
    enabled: useDb,
    testMode: useDb ? row!.testMode : true,
    config: {
      secretKey: useDb
        ? pickString(row!.secrets, "secretKey")
        : env.STRIPE_SECRET_KEY ?? null,
      webhookSecret: useDb
        ? pickString(row!.secrets, "webhookSecret")
        : env.STRIPE_WEBHOOK_SECRET ?? null,
      publishableKey: useDb
        ? pickString(row!.publicConfig, "publishableKey")
        : null,
    },
  };
}

export async function getPaystackConfig(): Promise<ResolveResult<PaystackConfig>> {
  const row = await readDbRow("paystack");
  const useDb = !!row?.enabled;

  return {
    source: useDb ? "db" : env.PAYSTACK_SECRET_KEY ? "env" : "none",
    enabled: useDb,
    testMode: useDb ? row!.testMode : true,
    config: {
      secretKey: useDb
        ? pickString(row!.secrets, "secretKey")
        : env.PAYSTACK_SECRET_KEY ?? null,
      publicKey: useDb ? pickString(row!.publicConfig, "publicKey") : null,
    },
  };
}

export async function getSmtpConfig(): Promise<ResolveResult<SmtpConfig>> {
  const row = await readDbRow("smtp");
  const useDb = !!row?.enabled;

  let port: number | null = null;
  if (useDb) {
    const raw = row!.publicConfig.port;
    if (typeof raw === "number") port = raw;
    else if (typeof raw === "string" && raw !== "") port = Number(raw) || null;
  } else {
    port = env.SMTP_PORT ?? null;
  }

  const secure = useDb
    ? Boolean(row!.publicConfig.secure)
    : Boolean(env.SMTP_SECURE);

  return {
    source: useDb
      ? "db"
      : env.SMTP_HOST && env.SMTP_USER
        ? "env"
        : "none",
    enabled: useDb,
    testMode: useDb ? row!.testMode : false,
    config: {
      host: useDb
        ? pickString(row!.publicConfig, "host")
        : env.SMTP_HOST ?? null,
      port,
      secure,
      user: useDb
        ? pickString(row!.publicConfig, "user")
        : env.SMTP_USER ?? null,
      pass: useDb
        ? pickString(row!.secrets, "pass")
        : env.SMTP_PASS ?? null,
      from: useDb
        ? pickString(row!.publicConfig, "from") ??
          env.EMAIL_FROM ??
          "SafariCart <no-reply@safaricart.co.ke>"
        : env.EMAIL_FROM ?? "SafariCart <no-reply@safaricart.co.ke>",
      fromByPurpose: resolveFromByPurpose(useDb ? row!.publicConfig : null),
    },
  };
}

function resolveFromByPurpose(
  publicConfig: Record<string, unknown> | null,
): Partial<Record<MailPurpose, string>> {
  // DB values win over env. Both are optional — anything missing falls back
  // to the default `from` at send time.
  const out: Partial<Record<MailPurpose, string>> = {};
  const pc = publicConfig ?? {};
  const pairs: [MailPurpose, string | null | undefined, string | undefined][] = [
    ["system", pickString(pc, "fromSystem"), env.EMAIL_FROM_SYSTEM],
    ["orders", pickString(pc, "fromOrders"), env.EMAIL_FROM_ORDERS],
    ["support", pickString(pc, "fromSupport"), env.EMAIL_FROM_SUPPORT],
    ["sales", pickString(pc, "fromSales"), env.EMAIL_FROM_SALES],
  ];
  for (const [purpose, dbValue, envValue] of pairs) {
    const v = dbValue ?? envValue;
    if (v) out[purpose] = v;
  }
  return out;
}

export async function getCloudinaryConfig(): Promise<ResolveResult<CloudinaryConfig>> {
  const row = await readDbRow("cloudinary");
  const useDb = !!row?.enabled;

  return {
    source: useDb
      ? "db"
      : env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY
        ? "env"
        : "none",
    enabled: useDb,
    testMode: false,
    config: {
      cloudName: useDb
        ? pickString(row!.publicConfig, "cloudName")
        : env.CLOUDINARY_CLOUD_NAME ?? null,
      apiKey: useDb
        ? pickString(row!.secrets, "apiKey")
        : env.CLOUDINARY_API_KEY ?? null,
      apiSecret: useDb
        ? pickString(row!.secrets, "apiSecret")
        : env.CLOUDINARY_API_SECRET ?? null,
      uploadFolder: useDb
        ? pickString(row!.publicConfig, "uploadFolder") ??
          env.CLOUDINARY_UPLOAD_FOLDER
        : env.CLOUDINARY_UPLOAD_FOLDER,
    },
  };
}

// ─── Admin-side helpers (status overview) ─────────────────────────────────

export type IntegrationStatus = {
  scope: IntegrationScope;
  source: Source;
  enabled: boolean;
  testMode: boolean;
  envFallbackAvailable: boolean;
  /** True if any stored secrets are AES-encrypted (vs base64 plaintext). */
  encryptedAtRest: boolean;
  /** True if any secrets are stored in plaintext in the DB. */
  hasPlaintextSecrets: boolean;
  /** Public values safe to render in the admin form. */
  publicConfig: Record<string, unknown>;
  /** Map of secret keys → "set" / "missing" (never the value itself). */
  secretFlags: Record<string, "set" | "missing">;
  /** Last 4 chars of each known secret, so the admin recognises it. */
  secretHints: Record<string, string | null>;
  updatedAt: Date | null;
};

const SCOPE_FIELDS: Record<
  IntegrationScope,
  { publicKeys: string[]; secretKeys: string[] }
> = {
  mpesa: {
    publicKeys: ["shortcode", "callbackUrl"],
    secretKeys: ["consumerKey", "consumerSecret", "passkey"],
  },
  stripe: {
    publicKeys: ["publishableKey"],
    secretKeys: ["secretKey", "webhookSecret"],
  },
  paystack: {
    publicKeys: ["publicKey"],
    secretKeys: ["secretKey"],
  },
  smtp: {
    publicKeys: [
      "host",
      "port",
      "secure",
      "user",
      "from",
      "fromSystem",
      "fromOrders",
      "fromSupport",
      "fromSales",
    ],
    secretKeys: ["pass"],
  },
  cloudinary: {
    publicKeys: ["cloudName", "uploadFolder"],
    secretKeys: ["apiKey", "apiSecret"],
  },
};

function envFallbackAvailable(scope: IntegrationScope): boolean {
  switch (scope) {
    case "mpesa":
      return Boolean(env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET);
    case "stripe":
      return Boolean(env.STRIPE_SECRET_KEY);
    case "paystack":
      return Boolean(env.PAYSTACK_SECRET_KEY);
    case "smtp":
      return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
    case "cloudinary":
      return Boolean(
        env.CLOUDINARY_CLOUD_NAME &&
          env.CLOUDINARY_API_KEY &&
          env.CLOUDINARY_API_SECRET,
      );
  }
}

function last4(value: string): string {
  if (value.length <= 4) return "•".repeat(value.length);
  return `••••${value.slice(-4)}`;
}

export async function getIntegrationStatus(
  scope: IntegrationScope,
): Promise<IntegrationStatus> {
  const fields = SCOPE_FIELDS[scope];
  const rawRow = await db.integration.findUnique({ where: { scope } });
  const row = await readDbRow(scope);
  const publicConfig: Record<string, unknown> = {};
  const secretFlags: Record<string, "set" | "missing"> = {};
  const secretHints: Record<string, string | null> = {};

  for (const k of fields.publicKeys) {
    publicConfig[k] = row?.publicConfig?.[k] ?? null;
  }
  for (const k of fields.secretKeys) {
    const v = row?.secrets?.[k];
    if (typeof v === "string" && v.length > 0) {
      secretFlags[k] = "set";
      secretHints[k] = last4(v);
    } else {
      secretFlags[k] = "missing";
      secretHints[k] = null;
    }
  }

  const source: Source = row?.enabled ? "db" : envFallbackAvailable(scope) ? "env" : "none";
  const hasSecrets = !!rawRow?.secretsCipher;
  const encryptedAtRest = hasSecrets && isEncryptedAtRest(rawRow.secretsCipher);

  return {
    scope,
    source,
    enabled: !!row?.enabled,
    testMode: row?.testMode ?? true,
    envFallbackAvailable: envFallbackAvailable(scope),
    encryptedAtRest,
    hasPlaintextSecrets: hasSecrets && !encryptedAtRest,
    publicConfig,
    secretFlags,
    secretHints,
    updatedAt: rawRow?.updatedAt ?? null,
  };
}

export async function getAllIntegrationStatuses(): Promise<IntegrationStatus[]> {
  return Promise.all(INTEGRATION_SCOPES.map(getIntegrationStatus));
}

// Suppress lint: we expose a no-op cached marker so future callers can opt
// into request-deduped resolution without changing call sites.
export const _internal = { unstable_cache };
