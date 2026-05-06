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

export type CartActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

export async function addToCartAction(formData: FormData) {
  const productId = productIdSchema.parse(formData.get("productId"));
  const quantity = quantitySchema.parse(formData.get("quantity") ?? "1");
  await cart.addToCart(productId, Math.max(1, quantity));
  revalidateCartUI();
}

/**
 * Stateful version of addToCartAction for client forms that want to display
 * a toast on success/error. The void variant above is still used by
 * addToCartAndCheckoutAction (which redirects, so no UI feedback is needed).
 */
export async function addToCartFormAction(
  _prev: CartActionResult,
  formData: FormData,
): Promise<CartActionResult> {
  try {
    const productId = productIdSchema.parse(formData.get("productId"));
    const quantity = quantitySchema.parse(formData.get("quantity") ?? "1");
    await cart.addToCart(productId, Math.max(1, quantity));
    revalidateCartUI();
    return { ok: true, message: "Added to cart" };
  } catch (error) {
    console.error("addToCart failed", error);
    return { ok: false, error: "Could not add to cart. Please try again." };
  }
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
