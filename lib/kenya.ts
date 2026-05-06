/**
 * Kenya-specific helpers used across both server and client code.
 * Pure functions only — no I/O, no DB, no env access.
 */

export const KENYAN_COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita-Taveta",
  "Garissa",
  "Wajir",
  "Mandera",
  "Marsabit",
  "Isiolo",
  "Meru",
  "Tharaka-Nithi",
  "Embu",
  "Kitui",
  "Machakos",
  "Makueni",
  "Nyandarua",
  "Nyeri",
  "Kirinyaga",
  "Murang'a",
  "Kiambu",
  "Turkana",
  "West Pokot",
  "Samburu",
  "Trans Nzoia",
  "Uasin Gishu",
  "Elgeyo-Marakwet",
  "Nandi",
  "Baringo",
  "Laikipia",
  "Nakuru",
  "Narok",
  "Kajiado",
  "Kericho",
  "Bomet",
  "Kakamega",
  "Vihiga",
  "Bungoma",
  "Busia",
  "Siaya",
  "Kisumu",
  "Homa Bay",
  "Migori",
  "Kisii",
  "Nyamira",
  "Nairobi",
] as const;

export type KenyanCounty = (typeof KENYAN_COUNTIES)[number];

const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

/**
 * Format a money amount as Kenyan shillings.
 * Convention: prices are stored as integer KES in the database — no cents.
 */
export function formatKES(amount: number | bigint): string {
  return kesFormatter.format(amount);
}

const KE_MOBILE_LOCAL_RE = /^[71]\d{8}$/;

/**
 * Normalize a user-provided Kenyan phone number to E.164 (+254XXXXXXXXX).
 * Accepts formats: 0712345678, 712345678, 254712345678, +254712345678,
 * with or without spaces/dashes. Returns null if not a valid KE mobile.
 */
export function normalizeKenyanPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (digits.startsWith("254")) local = digits.slice(3);
  else if (digits.startsWith("0")) local = digits.slice(1);
  if (!KE_MOBILE_LOCAL_RE.test(local)) return null;
  return `+254${local}`;
}

export function isValidKenyanPhone(input: string): boolean {
  return normalizeKenyanPhone(input) !== null;
}

/** Display +254712345678 as "+254 712 345 678". Pass-through if normalize fails. */
export function formatKenyanPhone(input: string): string {
  const e164 = normalizeKenyanPhone(input);
  if (!e164) return input;
  return `${e164.slice(0, 4)} ${e164.slice(4, 7)} ${e164.slice(7, 10)} ${e164.slice(10)}`;
}
