import "server-only";
import { z } from "zod";

// Treat empty strings as "unset" so .env files with blank placeholders pass
// validation (they'd otherwise fail .url() / .min(1) checks).
const optionalUrl = z
  .string()
  .optional()
  .transform((v) => (v === "" || v == null ? undefined : v))
  .pipe(z.string().url().optional());

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" || v == null ? undefined : v));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().url(),

  // Public origin used for email links, callback URLs, sitemap. Falls back to AUTH_URL.
  APP_URL: optionalUrl,

  AUTH_SECRET: optionalString,
  AUTH_URL: optionalUrl,
  AUTH_GOOGLE_ID: optionalString,
  AUTH_GOOGLE_SECRET: optionalString,
  AUTH_FACEBOOK_ID: optionalString,
  AUTH_FACEBOOK_SECRET: optionalString,
  AUTH_GITHUB_ID: optionalString,
  AUTH_GITHUB_SECRET: optionalString,

  // M-Pesa Daraja
  MPESA_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  MPESA_CONSUMER_KEY: optionalString,
  MPESA_CONSUMER_SECRET: optionalString,
  MPESA_SHORTCODE: optionalString,
  MPESA_PASSKEY: optionalString,
  MPESA_CALLBACK_URL: optionalUrl,

  PAYSTACK_SECRET_KEY: optionalString,

  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,

  // SMTP (nodemailer)
  SMTP_HOST: optionalString,
  SMTP_PORT: z
    .string()
    .optional()
    .transform((v) => {
      if (v === "" || v == null) return undefined;
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? n : undefined;
    }),
  SMTP_SECURE: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  EMAIL_FROM: optionalString,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  // Folder all uploads land in within Cloudinary.
  CLOUDINARY_UPLOAD_FOLDER: z.string().default("safaricart"),

  // 32-byte key (base64) used to encrypt integration secrets at rest in the
  // Integration table. Generate with: openssl rand -base64 32
  // Required only if you store secrets via /admin/integrations.
  SETTINGS_ENCRYPTION_KEY: optionalString,
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

/** Public origin for outbound links (emails, sitemap, callbacks). */
export function publicAppUrl(): string {
  if (env.APP_URL) return env.APP_URL;
  if (env.AUTH_URL) return env.AUTH_URL;
  // Vercel auto-injects these — let first deploys work without manual config.
  // VERCEL_PROJECT_PRODUCTION_URL is the stable prod alias; VERCEL_URL is the
  // per-deployment URL (preview branches, etc.).
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
