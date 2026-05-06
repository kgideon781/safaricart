"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireRole } from "@/server/auth";
import { slugify } from "@/lib/text";
import type { FormResult } from "@/server/actions/account";

// ─── Vendor moderation ────────────────────────────────────────────────────

export async function approveVendorAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/vendors");
  const id = String(formData.get("id"));
  if (!id) return;
  await db.vendor.update({
    where: { id },
    data: { status: "APPROVED", verifiedAt: new Date() },
  });
  revalidatePath("/admin/vendors");
}

export async function suspendVendorAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/vendors");
  const id = String(formData.get("id"));
  if (!id) return;
  await db.vendor.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });
  revalidatePath("/admin/vendors");
}

export async function reactivateVendorAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/vendors");
  const id = String(formData.get("id"));
  if (!id) return;
  await db.vendor.update({
    where: { id },
    data: { status: "APPROVED" },
  });
  revalidatePath("/admin/vendors");
}

// ─── Category CRUD ────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  isFeatured: z
    .union([z.literal("on"), z.literal("true"), z.string()])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export async function createCategoryAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  await requireRole("ADMIN", "/admin/categories");

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? undefined,
    description: formData.get("description") ?? undefined,
    imageUrl: formData.get("imageUrl") ?? undefined,
    isFeatured: formData.get("isFeatured") ?? undefined,
    sortOrder: formData.get("sortOrder") ?? "0",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let slug = parsed.data.slug ?? slugify(parsed.data.name);
  if (!slug) return { error: "Could not derive a slug" };

  let attempt = 0;
  while (await db.category.findUnique({ where: { slug }, select: { id: true } })) {
    attempt += 1;
    slug = `${parsed.data.slug ?? slugify(parsed.data.name)}-${attempt}`;
    if (attempt > 50) return { error: "Slug collision — pick a different name" };
  }

  await db.category.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      isFeatured: parsed.data.isFeatured,
      sortOrder: parsed.data.sortOrder,
    },
  });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/categories");
  const id = String(formData.get("id"));
  if (!id) return;

  // Refuse to delete categories that still have products
  const used = await db.product.count({ where: { categoryId: id } });
  if (used > 0) return;

  await db.category.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/categories");
}

// ─── Order moderation ─────────────────────────────────────────────────────

/**
 * Force-mark an order as PAID. Useful while payment webhooks aren't wired
 * up yet — lets us exercise the post-payment flow with stub transactions.
 */
export async function markOrderPaidAction(formData: FormData) {
  await requireRole("ADMIN", "/admin/orders");
  const id = String(formData.get("id"));
  if (!id) return;
  await db.order.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath("/admin/orders");
}
