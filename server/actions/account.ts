"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireSession } from "@/server/auth";
import { KENYAN_COUNTIES, normalizeKenyanPhone } from "@/lib/kenya";

export type FormResult = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
} | null;

// ─── Profile ──────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export async function updateProfileAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const session = await requireSession("/account");

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let phone: string | null = null;
  if (parsed.data.phone) {
    const normalized = normalizeKenyanPhone(parsed.data.phone);
    if (!normalized) {
      return { fieldErrors: { phone: ["Enter a valid Kenyan mobile number"] } };
    }
    phone = normalized;
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name, phone },
  });

  revalidatePath("/account");
  return { success: "Profile updated" };
}

// ─── Addresses ────────────────────────────────────────────────────────────

const addressSchema = z.object({
  label: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  recipientName: z.string().trim().min(2).max(100),
  recipientPhone: z.string().trim().min(1, "Phone number is required"),
  county: z.string().refine((v) => (KENYAN_COUNTIES as readonly string[]).includes(v), {
    message: "Pick a valid Kenyan county",
  }),
  subCounty: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  ward: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  streetAddress: z.string().trim().min(3).max(200),
  landmark: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  isDefault: z
    .union([z.literal("on"), z.literal("true"), z.string()])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export async function createAddressAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const session = await requireSession("/account/addresses");

  const parsed = addressSchema.safeParse({
    label: formData.get("label") ?? undefined,
    recipientName: formData.get("recipientName"),
    recipientPhone: formData.get("recipientPhone"),
    county: formData.get("county"),
    subCounty: formData.get("subCounty") ?? undefined,
    ward: formData.get("ward") ?? undefined,
    streetAddress: formData.get("streetAddress"),
    landmark: formData.get("landmark") ?? undefined,
    isDefault: formData.get("isDefault") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const phone = normalizeKenyanPhone(parsed.data.recipientPhone);
  if (!phone) {
    return {
      fieldErrors: { recipientPhone: ["Enter a valid Kenyan mobile number"] },
    };
  }

  await db.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }
    const existingCount = await tx.address.count({
      where: { userId: session.user.id },
    });
    await tx.address.create({
      data: {
        userId: session.user.id,
        label: parsed.data.label,
        recipientName: parsed.data.recipientName,
        recipientPhone: phone,
        county: parsed.data.county,
        subCounty: parsed.data.subCounty,
        ward: parsed.data.ward,
        streetAddress: parsed.data.streetAddress,
        landmark: parsed.data.landmark,
        // First address auto-defaults
        isDefault: parsed.data.isDefault || existingCount === 0,
      },
    });
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddressAction(formData: FormData) {
  const session = await requireSession("/account/addresses");
  const id = String(formData.get("id"));
  if (!id) return;

  // Only allow deleting if it belongs to the user
  const deleted = await db.address.deleteMany({
    where: { id, userId: session.user.id },
  });

  // If we deleted the default and others remain, promote the most recent.
  if (deleted.count > 0) {
    const remaining = await db.address.findFirst({
      where: { userId: session.user.id, isDefault: true },
    });
    if (!remaining) {
      const next = await db.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await db.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  }
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(formData: FormData) {
  const session = await requireSession("/account/addresses");
  const id = String(formData.get("id"));
  if (!id) return;

  // Verify ownership
  const owned = await db.address.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) return;

  await db.$transaction([
    db.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    }),
    db.address.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);
  revalidatePath("/account/addresses");
}
