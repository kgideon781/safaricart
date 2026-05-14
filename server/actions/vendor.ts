"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { OrderItemFulfillmentStatus } from "@prisma/client";
import { db } from "@/server/db";
import { requireSession } from "@/server/auth";
import { requireVendor } from "@/server/vendor";
import { KENYAN_COUNTIES, normalizeKenyanPhone } from "@/lib/kenya";
import { slugify } from "@/lib/text";
import { parseCsv } from "@/lib/csv";
import { creditVendorsForOrder } from "@/server/payouts";
import { vendorPayableKes } from "@/server/payouts";
import { notifyAdminsNewVendor, notifyAdminsKycUpload } from "@/server/email/admin";
import { logger } from "@/server/log";
import type { FormResult } from "@/server/actions/account";
import type { VendorDocumentType } from "@prisma/client";

const log = logger("vendor-actions");

// ─── Vendor registration ──────────────────────────────────────────────────

const vendorRegisterSchema = z.object({
  name: z.string().trim().min(2, "Business name is required").max(100),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z.string().trim().min(1, "Phone number is required"),
  county: z.string().refine((v) => (KENYAN_COUNTIES as readonly string[]).includes(v), {
    message: "Pick a valid Kenyan county",
  }),
});

export async function registerVendorAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const session = await requireSession("/vendor/register");

  // Already a vendor — bounce to dashboard
  const existing = await db.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) redirect("/vendor/dashboard");

  const parsed = vendorRegisterSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    county: formData.get("county"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const phone = normalizeKenyanPhone(parsed.data.contactPhone);
  if (!phone) {
    return {
      fieldErrors: { contactPhone: ["Enter a valid Kenyan mobile number"] },
    };
  }

  // Generate a unique slug — append a numeric suffix on collision.
  let slug = slugify(parsed.data.name);
  if (!slug) slug = "vendor";
  let attempt = 0;
  while (
    await db.vendor.findUnique({ where: { slug }, select: { id: true } })
  ) {
    attempt += 1;
    slug = `${slugify(parsed.data.name) || "vendor"}-${attempt}`;
    if (attempt > 50) {
      return { error: "Could not generate a unique slug — please tweak your business name." };
    }
  }

  await db.$transaction(async (tx) => {
    await tx.vendor.create({
      data: {
        userId: session.user.id,
        slug,
        name: parsed.data.name,
        description: parsed.data.description,
        contactEmail: parsed.data.contactEmail,
        contactPhone: phone,
        county: parsed.data.county,
        status: "PENDING",
      },
    });
    await tx.user.update({
      where: { id: session.user.id },
      data: { role: "VENDOR" },
    });
  });

  notifyAdminsNewVendor({
    vendorName: parsed.data.name,
    vendorSlug: slug,
    contactEmail: parsed.data.contactEmail,
    county: parsed.data.county,
  }).catch((err) => log.error("admin notify failed", { err: String(err) }));

  redirect("/vendor/dashboard");
}

// ─── Product CRUD ─────────────────────────────────────────────────────────

const productSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(5000),
  categoryId: z.string().min(1, "Pick a category"),
  priceKes: z.coerce.number().int().min(1, "Price must be at least KES 1"),
  compareAtPriceKes: z
    .preprocess(
      (v) => (v === "" || v == null ? null : v),
      z.coerce.number().int().positive().nullable(),
    )
    .optional(),
  stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
  weightGrams: z
    .preprocess(
      (v) => (v === "" || v == null ? null : v),
      z.coerce.number().int().positive().nullable(),
    )
    .optional(),
  images: z
    .preprocess(
      (v) => {
        if (typeof v !== "string" || v.trim() === "") return [];
        try {
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      },
      z
        .array(z.string().url())
        .max(8, "Up to 8 images")
        .default([]),
    )
    .default([]),
  isPublished: z
    .union([z.literal("on"), z.literal("true"), z.string()])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export async function createProductAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const { vendor } = await requireVendor("/vendor/dashboard/products/new");

  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    priceKes: formData.get("priceKes"),
    compareAtPriceKes: formData.get("compareAtPriceKes"),
    stock: formData.get("stock") ?? "0",
    weightGrams: formData.get("weightGrams"),
    images: formData.get("images") ?? "",
    isPublished: formData.get("isPublished") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let slug = slugify(parsed.data.title);
  if (!slug) slug = "product";
  let attempt = 0;
  while (await db.product.findUnique({ where: { slug }, select: { id: true } })) {
    attempt += 1;
    slug = `${slugify(parsed.data.title) || "product"}-${attempt}`;
    if (attempt > 50) {
      return { error: "Could not generate a unique slug for this title." };
    }
  }

  await db.product.create({
    data: {
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      vendorId: vendor.id,
      categoryId: parsed.data.categoryId,
      priceKes: parsed.data.priceKes,
      compareAtPriceKes: parsed.data.compareAtPriceKes ?? null,
      stock: parsed.data.stock,
      weightGrams: parsed.data.weightGrams ?? null,
      images: parsed.data.images,
      isPublished: parsed.data.isPublished,
    },
  });

  revalidatePath("/vendor/dashboard/products");
  redirect("/vendor/dashboard/products");
}

export async function updateProductAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const { vendor } = await requireVendor();
  const productId = String(formData.get("id"));
  if (!productId) return { error: "Missing product ID" };

  // Ownership check
  const existing = await db.product.findFirst({
    where: { id: productId, vendorId: vendor.id },
    select: { id: true },
  });
  if (!existing) return { error: "Product not found" };

  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    priceKes: formData.get("priceKes"),
    compareAtPriceKes: formData.get("compareAtPriceKes"),
    stock: formData.get("stock") ?? "0",
    weightGrams: formData.get("weightGrams"),
    images: formData.get("images") ?? "",
    isPublished: formData.get("isPublished") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.product.update({
    where: { id: productId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      priceKes: parsed.data.priceKes,
      compareAtPriceKes: parsed.data.compareAtPriceKes ?? null,
      stock: parsed.data.stock,
      weightGrams: parsed.data.weightGrams ?? null,
      images: parsed.data.images,
      isPublished: parsed.data.isPublished,
    },
  });

  revalidatePath("/vendor/dashboard/products");
  revalidatePath(`/vendor/dashboard/products/${productId}/edit`);
  return { success: "Product updated" };
}

export async function deleteProductAction(formData: FormData) {
  const { vendor } = await requireVendor();
  const id = String(formData.get("id"));
  if (!id) return;

  // Soft-protect: if it has any order items, just unpublish; otherwise delete.
  const used = await db.orderItem.count({ where: { productId: id, vendorId: vendor.id } });
  if (used > 0) {
    await db.product.updateMany({
      where: { id, vendorId: vendor.id },
      data: { isPublished: false },
    });
  } else {
    await db.product.deleteMany({ where: { id, vendorId: vendor.id } });
  }
  revalidatePath("/vendor/dashboard/products");
}

// ─── Bulk product import (CSV) ────────────────────────────────────────────

export type BulkRowError = { row: number; errors: string[] };
export type BulkUploadResult =
  | null
  | { error: string }
  | {
      success: string;
      created: number;
      failed: number;
      rowErrors: BulkRowError[];
    };

const bulkRowSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(5000),
  categorySlug: z.string().trim().min(1),
  priceKes: z.coerce.number().int().min(1),
  compareAtPriceKes: z
    .preprocess(
      (v) => (v === "" || v == null ? null : v),
      z.coerce.number().int().positive().nullable(),
    )
    .optional(),
  stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
  weightGrams: z
    .preprocess(
      (v) => (v === "" || v == null ? null : v),
      z.coerce.number().int().positive().nullable(),
    )
    .optional(),
  sku: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  imageUrls: z
    .preprocess(
      (v) => {
        if (typeof v !== "string" || v.trim() === "") return [];
        return v
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
      },
      z.array(z.string().url()).max(8),
    )
    .default([]),
  isPublished: z
    .string()
    .optional()
    .transform((v) => {
      const norm = (v ?? "").trim().toLowerCase();
      if (norm === "" || norm === "true" || norm === "1" || norm === "yes") return true;
      return false;
    }),
});

export async function bulkCreateProductsAction(
  _prev: BulkUploadResult,
  formData: FormData,
): Promise<BulkUploadResult> {
  const { vendor } = await requireVendor("/vendor/dashboard/products/bulk");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pick a CSV file to upload." };
  }
  if (file.size > 2_000_000) {
    return { error: "CSV is too large (max 2 MB)." };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { error: "The file is empty." };
  }

  // Skip leading documentation lines that start with "#" in the first column.
  let cursor = 0;
  while (
    cursor < rows.length &&
    (rows[cursor].length === 0 ||
      (rows[cursor][0] ?? "").trim().startsWith("#") ||
      rows[cursor].every((c) => (c ?? "").trim() === ""))
  ) {
    cursor++;
  }
  if (cursor >= rows.length) {
    return { error: "No header row found." };
  }

  const header = rows[cursor].map((h) => h.trim());
  cursor++;

  // Validate the header — vendors might rearrange columns; we map by name.
  const headerIndex: Record<string, number> = {};
  header.forEach((name, i) => {
    headerIndex[name] = i;
  });
  const REQUIRED = ["title", "description", "categorySlug", "priceKes"] as const;
  const missing = REQUIRED.filter((h) => !(h in headerIndex));
  if (missing.length > 0) {
    return { error: `Missing required columns: ${missing.join(", ")}` };
  }

  const dataRows = rows.slice(cursor).filter((r) => r.some((c) => (c ?? "").trim() !== ""));
  if (dataRows.length === 0) {
    return { error: "No data rows found." };
  }
  if (dataRows.length > 500) {
    return { error: "Too many rows (max 500 per upload)." };
  }

  // Pre-load categories so we can resolve slugs without N+1 queries.
  const categories = await db.category.findMany({
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((c) => [c.slug.toLowerCase(), c.id]));

  // Collect existing slugs/SKUs once; track new ones in-memory to avoid
  // collisions within the batch itself.
  const usedSlugs = new Set<string>(
    (
      await db.product.findMany({ select: { slug: true } })
    ).map((p) => p.slug),
  );
  const usedSkus = new Set<string>(
    (
      await db.product.findMany({
        where: { vendorId: vendor.id, sku: { not: null } },
        select: { sku: true },
      })
    )
      .map((p) => p.sku)
      .filter((s): s is string => s !== null),
  );

  type Prepared = {
    slug: string;
    title: string;
    description: string;
    categoryId: string;
    priceKes: number;
    compareAtPriceKes: number | null;
    stock: number;
    weightGrams: number | null;
    sku: string | null;
    images: string[];
    isPublished: boolean;
  };

  const prepared: Prepared[] = [];
  const rowErrors: BulkRowError[] = [];

  dataRows.forEach((cells, idx) => {
    // Human-friendly row number = header offset + data index + 1
    const rowNumber = cursor + idx + 1;

    const get = (key: string) => {
      const i = headerIndex[key];
      return i == null ? "" : (cells[i] ?? "").trim();
    };

    const parsed = bulkRowSchema.safeParse({
      title: get("title"),
      description: get("description"),
      categorySlug: get("categorySlug"),
      priceKes: get("priceKes"),
      compareAtPriceKes: get("compareAtPriceKes"),
      stock: get("stock") || "0",
      weightGrams: get("weightGrams"),
      sku: get("sku"),
      imageUrls: get("imageUrls"),
      isPublished: get("isPublished"),
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const messages = Object.entries(flat).flatMap(([field, errs]) =>
        (errs ?? []).map((e) => `${field}: ${e}`),
      );
      rowErrors.push({ row: rowNumber, errors: messages });
      return;
    }

    const categoryId = categoryBySlug.get(parsed.data.categorySlug.toLowerCase());
    if (!categoryId) {
      rowErrors.push({
        row: rowNumber,
        errors: [`categorySlug: unknown category "${parsed.data.categorySlug}"`],
      });
      return;
    }

    let slug = slugify(parsed.data.title) || "product";
    if (usedSlugs.has(slug)) {
      let attempt = 1;
      while (usedSlugs.has(`${slug}-${attempt}`) && attempt <= 200) attempt++;
      if (attempt > 200) {
        rowErrors.push({ row: rowNumber, errors: ["Could not generate unique slug"] });
        return;
      }
      slug = `${slug}-${attempt}`;
    }
    usedSlugs.add(slug);

    let sku = parsed.data.sku;
    if (sku) {
      if (usedSkus.has(sku)) {
        rowErrors.push({
          row: rowNumber,
          errors: [`sku: "${sku}" is already used`],
        });
        return;
      }
      usedSkus.add(sku);
    }

    prepared.push({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      categoryId,
      priceKes: parsed.data.priceKes,
      compareAtPriceKes: parsed.data.compareAtPriceKes ?? null,
      stock: parsed.data.stock,
      weightGrams: parsed.data.weightGrams ?? null,
      sku,
      images: parsed.data.imageUrls,
      isPublished: parsed.data.isPublished,
    });
  });

  if (prepared.length > 0) {
    await db.product.createMany({
      data: prepared.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        vendorId: vendor.id,
        categoryId: p.categoryId,
        priceKes: p.priceKes,
        compareAtPriceKes: p.compareAtPriceKes,
        stock: p.stock,
        weightGrams: p.weightGrams,
        sku: p.sku,
        images: p.images,
        isPublished: p.isPublished,
      })),
    });
    revalidatePath("/vendor/dashboard/products");
  }

  const message =
    prepared.length === 0
      ? `No products imported — ${rowErrors.length} row${rowErrors.length === 1 ? "" : "s"} had errors.`
      : `Imported ${prepared.length} product${prepared.length === 1 ? "" : "s"}${
          rowErrors.length > 0 ? `; skipped ${rowErrors.length} with errors.` : "."
        }`;

  return {
    success: message,
    created: prepared.length,
    failed: rowErrors.length,
    rowErrors,
  };
}

// ─── Vendor profile settings ──────────────────────────────────────────────

const profileSchema = z.object({
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === "" ? null : v)),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z.string().trim().min(1, "Phone number is required"),
  county: z.string().refine((v) => (KENYAN_COUNTIES as readonly string[]).includes(v), {
    message: "Pick a valid Kenyan county",
  }),
  logoUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v ?? null)),
  coverUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v ?? null)),
  mpesaPaybill: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
  mpesaTillNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
  bankName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
  bankAccountName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
  bankAccountNumber: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
  kraPin: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
});

export async function updateVendorProfileAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const { vendor } = await requireVendor("/vendor/dashboard/settings");

  const parsed = profileSchema.safeParse({
    description: formData.get("description") ?? undefined,
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    county: formData.get("county"),
    logoUrl: formData.get("logoUrl") ?? undefined,
    coverUrl: formData.get("coverUrl") ?? undefined,
    mpesaPaybill: formData.get("mpesaPaybill") ?? undefined,
    mpesaTillNumber: formData.get("mpesaTillNumber") ?? undefined,
    bankName: formData.get("bankName") ?? undefined,
    bankAccountName: formData.get("bankAccountName") ?? undefined,
    bankAccountNumber: formData.get("bankAccountNumber") ?? undefined,
    kraPin: formData.get("kraPin") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const phone = normalizeKenyanPhone(parsed.data.contactPhone);
  if (!phone) {
    return {
      fieldErrors: { contactPhone: ["Enter a valid Kenyan mobile number"] },
    };
  }

  await db.vendor.update({
    where: { id: vendor.id },
    data: {
      description: parsed.data.description,
      contactEmail: parsed.data.contactEmail,
      contactPhone: phone,
      county: parsed.data.county,
      logoUrl: parsed.data.logoUrl,
      coverUrl: parsed.data.coverUrl,
      mpesaPaybill: parsed.data.mpesaPaybill,
      mpesaTillNumber: parsed.data.mpesaTillNumber,
      bankName: parsed.data.bankName,
      bankAccountName: parsed.data.bankAccountName,
      bankAccountNumber: parsed.data.bankAccountNumber,
      kraPin: parsed.data.kraPin,
    },
  });

  revalidatePath("/vendor/dashboard/settings");
  revalidatePath(`/vendor/${vendor.slug}`);
  return { success: "Settings saved." };
}

// ─── Vendor KYC documents ─────────────────────────────────────────────────

const VENDOR_DOC_TYPES = [
  "NATIONAL_ID",
  "BUSINESS_CERTIFICATE",
  "KRA_PIN_CERTIFICATE",
  "BANK_STATEMENT",
  "OTHER",
] as const satisfies readonly VendorDocumentType[];

const docUploadSchema = z.object({
  type: z.enum(VENDOR_DOC_TYPES),
  fileUrl: z.string().url("Upload a file first"),
});

export async function addVendorDocumentAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const { vendor } = await requireVendor("/vendor/dashboard/settings");
  const parsed = docUploadSchema.safeParse({
    type: formData.get("type"),
    fileUrl: formData.get("fileUrl"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await db.vendorDocument.create({
    data: {
      vendorId: vendor.id,
      type: parsed.data.type,
      fileUrl: parsed.data.fileUrl,
      status: "PENDING",
    },
  });
  notifyAdminsKycUpload({
    vendorName: vendor.name,
    vendorSlug: vendor.slug,
    docType: parsed.data.type,
  }).catch((err) => log.error("kyc notify failed", { err: String(err) }));
  revalidatePath("/vendor/dashboard/settings");
  return { success: "Document uploaded — pending review." };
}

export async function deleteVendorDocumentAction(formData: FormData) {
  const { vendor } = await requireVendor();
  const id = String(formData.get("id"));
  if (!id) return;
  await db.vendorDocument.deleteMany({ where: { id, vendorId: vendor.id } });
  revalidatePath("/vendor/dashboard/settings");
}

// Read-only summary used by the dashboard.
export async function getVendorPayableKes(vendorId: string): Promise<number> {
  return vendorPayableKes(vendorId);
}

// ─── Order item fulfillment ───────────────────────────────────────────────

const FULFILLMENT_VALUES = [
  "PENDING",
  "FULFILLING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly OrderItemFulfillmentStatus[];

const fulfillmentSchema = z.object({
  orderItemId: z.string().min(1),
  status: z.enum(FULFILLMENT_VALUES),
});

export async function updateOrderItemStatusAction(formData: FormData) {
  const { vendor } = await requireVendor();
  const parsed = fulfillmentSchema.safeParse({
    orderItemId: formData.get("orderItemId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await db.orderItem.updateMany({
    where: { id: parsed.data.orderItemId, vendorId: vendor.id },
    data: { fulfillmentStatus: parsed.data.status },
  });

  // For COD orders the vendor isn't credited at payment time — credit on
  // delivery. `creditVendorsForOrder` is idempotent so it's safe even for
  // prepaid orders that were already credited at PAID.
  if (parsed.data.status === "DELIVERED") {
    const item = await db.orderItem.findUnique({
      where: { id: parsed.data.orderItemId },
      select: { orderId: true },
    });
    if (item) {
      try {
        await creditVendorsForOrder(item.orderId);
      } catch (err) {
        console.error("ledger credit failed", err);
      }
    }
  }

  revalidatePath("/vendor/dashboard/orders");
}
