/**
 * Convert a string to a URL-safe slug.
 *   "Mama's Coastal Shop!" → "mamas-coastal-shop"
 */
export function slugify(input: string, maxLength = 60): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);
}
