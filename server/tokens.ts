import "server-only";
import crypto from "node:crypto";
import { db } from "@/server/db";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a one-time-use verification token, persist its SHA-256 hash, and
 * return the raw token to embed in an email link. The hash is what we store —
 * if the DB is leaked, the raw tokens cannot be recovered.
 *
 * `purpose` is "EMAIL_VERIFICATION" or "PASSWORD_RESET".
 */
export async function issueToken(
  email: string,
  purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
): Promise<string> {
  // Invalidate any prior token of the same purpose for this email — the latest
  // link wins. Cuts down on password-reset abuse vectors.
  await db.verificationToken.deleteMany({
    where: { identifier: email.toLowerCase(), purpose },
  });

  const raw = generateToken();
  const ttl = purpose === "PASSWORD_RESET" ? RESET_TTL_MS : VERIFICATION_TTL_MS;
  await db.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token: hashToken(raw),
      purpose,
      expires: new Date(Date.now() + ttl),
    },
  });
  return raw;
}

/**
 * Look up a token by its raw value, verify it matches the expected purpose,
 * and check expiry. Returns the identifier (email) on success, or null.
 *
 * Caller is responsible for consuming/deleting the token after use.
 */
export async function consumeToken(
  raw: string,
  purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
): Promise<string | null> {
  const hashed = hashToken(raw);
  const row = await db.verificationToken.findUnique({ where: { token: hashed } });
  if (!row) return null;
  if (row.purpose !== purpose) return null;
  if (row.expires.getTime() < Date.now()) {
    await db.verificationToken.delete({ where: { token: hashed } }).catch(() => {});
    return null;
  }
  await db.verificationToken.delete({ where: { token: hashed } }).catch(() => {});
  return row.identifier;
}
