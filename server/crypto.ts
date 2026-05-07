import "server-only";
import crypto from "node:crypto";
import { env } from "@/server/env";

/**
 * AES-256-GCM symmetric encryption for integration secrets stored at rest.
 *
 * Format on disk (single string):
 *   base64(iv) ":" base64(ciphertext) ":" base64(authTag)
 *
 * The key comes from SETTINGS_ENCRYPTION_KEY (32 raw bytes, base64-encoded).
 * Treat the key like a database password — losing it makes stored secrets
 * unrecoverable, and rotating it requires re-encrypting every row.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LEN = 12; // GCM standard
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  if (!env.SETTINGS_ENCRYPTION_KEY) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it to your env before storing integration secrets.",
    );
  }
  const raw = Buffer.from(env.SETTINGS_ENCRYPTION_KEY, "base64");
  if (raw.length !== 32) {
    throw new Error(
      `SETTINGS_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${raw.length}). Use \`openssl rand -base64 32\`.`,
    );
  }
  cachedKey = raw;
  return raw;
}

export function encryptionKeyAvailable(): boolean {
  if (!env.SETTINGS_ENCRYPTION_KEY) return false;
  try {
    const raw = Buffer.from(env.SETTINGS_ENCRYPTION_KEY, "base64");
    return raw.length === 32;
  } catch {
    return false;
  }
}

export function encryptJson(value: unknown): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    ciphertext.toString("base64"),
    tag.toString("base64"),
  ].join(":");
}

export function decryptJson<T = unknown>(payload: string): T {
  const key = getKey();
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed cipher payload");
  }
  const iv = Buffer.from(parts[0]!, "base64");
  const ciphertext = Buffer.from(parts[1]!, "base64");
  const tag = Buffer.from(parts[2]!, "base64");
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new Error("Cipher payload has unexpected IV or tag length");
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}

/**
 * Wrap a secrets blob for storage. Uses AES-256-GCM if SETTINGS_ENCRYPTION_KEY
 * is set; otherwise falls back to base64-encoded plaintext so the admin UI
 * stays usable without bootstrap configuration.
 *
 * Format prefix tells `unwrapSecrets` which path to take:
 *   "enc:..."  — AES-256-GCM ciphertext (`encryptJson` output)
 *   "pt:..."   — base64 of the raw JSON (no encryption)
 *
 * The plaintext path is genuinely less secure: anyone with database access
 * can read your live API keys. Setting SETTINGS_ENCRYPTION_KEY upgrades all
 * subsequent saves to encrypted storage.
 */
export function wrapSecrets(value: unknown): string {
  if (encryptionKeyAvailable()) {
    return `enc:${encryptJson(value)}`;
  }
  const json = JSON.stringify(value);
  return `pt:${Buffer.from(json, "utf8").toString("base64")}`;
}

export function unwrapSecrets<T = unknown>(payload: string): T {
  if (payload.startsWith("enc:")) {
    return decryptJson<T>(payload.slice(4));
  }
  if (payload.startsWith("pt:")) {
    const json = Buffer.from(payload.slice(3), "base64").toString("utf8");
    return JSON.parse(json) as T;
  }
  // Legacy unprefixed payloads were always encrypted.
  return decryptJson<T>(payload);
}

export function isEncryptedAtRest(payload: string | null | undefined): boolean {
  if (!payload) return false;
  if (payload.startsWith("pt:")) return false;
  return true;
}
