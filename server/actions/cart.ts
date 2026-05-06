"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as cart from "@/server/cart";

const productIdSchema = z.string().min(1);
const quantitySchema = z.coerce.number().int().min(0).max(99);

function revalidateCartUI() {
  // Revalidate the layout so the header's cart count updates everywhere.
  revalidatePath("/", "layout");
  revalidatePath("/cart");
}

export async function addToCartAction(formData: FormData) {
  const productId = productIdSchema.parse(formData.get("productId"));
  const quantity = quantitySchema.parse(formData.get("quantity") ?? "1");
  await cart.addToCart(productId, Math.max(1, quantity));
  revalidateCartUI();
}

export async function addToCartAndCheckoutAction(formData: FormData) {
  await addToCartAction(formData);
  redirect("/cart");
}

export async function updateCartQuantityAction(formData: FormData) {
  const productId = productIdSchema.parse(formData.get("productId"));
  const quantity = quantitySchema.parse(formData.get("quantity"));
  await cart.updateCartQuantity(productId, quantity);
  revalidateCartUI();
}

export async function removeFromCartAction(formData: FormData) {
  const productId = productIdSchema.parse(formData.get("productId"));
  await cart.removeFromCart(productId);
  revalidateCartUI();
}
