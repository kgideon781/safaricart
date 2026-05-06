import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const GUEST_COOKIE = "sc_cart";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const MAX_QTY_PER_LINE = 99;

const guestCartSchema = z.array(
  z.object({
    productId: z.string(),
    quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
  }),
);

type RawCartItem = { productId: string; quantity: number };

export type CartItemView = {
  productId: string;
  slug: string;
  title: string;
  image: string | null;
  unitPriceKes: number;
  quantity: number;
  stock: number;
  vendorName: string;
  lineTotalKes: number;
};

export type CartView = {
  items: CartItemView[];
  subtotalKes: number;
  itemCount: number;
};

// ─── Cookie helpers (writes only safe from server actions / route handlers) ──

async function readGuestCart(): Promise<RawCartItem[]> {
  const store = await cookies();
  const raw = store.get(GUEST_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = guestCartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

async function writeGuestCart(items: RawCartItem[]): Promise<void> {
  const store = await cookies();
  if (items.length === 0) {
    store.delete(GUEST_COOKIE);
    return;
  }
  store.set(GUEST_COOKIE, JSON.stringify(items), {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

// ─── DB helpers ────────────────────────────────────────────────────────────

async function ensureDbCart(userId: string) {
  return db.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
}

async function readDbCart(userId: string): Promise<RawCartItem[]> {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: true },
  });
  if (!cart) return [];
  return cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
}

// ─── Hydration ─────────────────────────────────────────────────────────────

async function hydrate(items: RawCartItem[]): Promise<CartItemView[]> {
  if (items.length === 0) return [];
  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    include: { vendor: { select: { name: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return items
    .map((i): CartItemView | null => {
      const p = byId.get(i.productId);
      if (!p) return null;
      return {
        productId: p.id,
        slug: p.slug,
        title: p.title,
        image: p.images[0] ?? null,
        unitPriceKes: p.priceKes,
        quantity: i.quantity,
        stock: p.stock,
        vendorName: p.vendor.name,
        lineTotalKes: p.priceKes * i.quantity,
      };
    })
    .filter((x): x is CartItemView => x !== null);
}

function summarize(items: CartItemView[]): CartView {
  return {
    items,
    subtotalKes: items.reduce((sum, i) => sum + i.lineTotalKes, 0),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

// ─── Reads (safe in server components) ─────────────────────────────────────

export async function getCart(): Promise<CartView> {
  const session = await auth();
  if (session?.user?.id) {
    const items = await readDbCart(session.user.id);
    return summarize(await hydrate(items));
  }
  const items = await readGuestCart();
  return summarize(await hydrate(items));
}

export async function getCartCount(): Promise<number> {
  const session = await auth();
  if (session?.user?.id) {
    const agg = await db.cartItem.aggregate({
      where: { cart: { userId: session.user.id } },
      _sum: { quantity: true },
    });
    return agg._sum.quantity ?? 0;
  }
  const items = await readGuestCart();
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

// ─── Mutations (call from server actions only) ─────────────────────────────

/**
 * Merge a logged-in user's guest cart cookie into their DB cart and clear
 * the cookie. Idempotent and safe to call repeatedly. No-op if no guest
 * cart exists.
 */
export async function maybeMergeGuestCartIntoDb(userId: string): Promise<void> {
  const guest = await readGuestCart();
  if (guest.length === 0) return;

  const cart = await ensureDbCart(userId);
  for (const item of guest) {
    await db.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
      create: { cartId: cart.id, productId: item.productId, quantity: item.quantity },
      update: { quantity: { increment: item.quantity } },
    });
  }
  await writeGuestCart([]);
}

export async function addToCart(productId: string, quantity = 1): Promise<void> {
  const qty = Math.max(1, Math.min(MAX_QTY_PER_LINE, quantity));
  const session = await auth();

  if (session?.user?.id) {
    await maybeMergeGuestCartIntoDb(session.user.id);
    const cart = await ensureDbCart(session.user.id);
    await db.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: qty },
      update: { quantity: { increment: qty } },
    });
    return;
  }

  const guest = await readGuestCart();
  const existing = guest.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = Math.min(MAX_QTY_PER_LINE, existing.quantity + qty);
  } else {
    guest.push({ productId, quantity: qty });
  }
  await writeGuestCart(guest);
}

export async function updateCartQuantity(
  productId: string,
  quantity: number,
): Promise<void> {
  const safe = Math.max(0, Math.min(MAX_QTY_PER_LINE, quantity));
  if (safe === 0) {
    await removeFromCart(productId);
    return;
  }

  const session = await auth();
  if (session?.user?.id) {
    await maybeMergeGuestCartIntoDb(session.user.id);
    const cart = await ensureDbCart(session.user.id);
    await db.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: safe },
      update: { quantity: safe },
    });
    return;
  }

  const guest = await readGuestCart();
  const existing = guest.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = safe;
  } else {
    guest.push({ productId, quantity: safe });
  }
  await writeGuestCart(guest);
}

export async function removeFromCart(productId: string): Promise<void> {
  const session = await auth();
  if (session?.user?.id) {
    await db.cartItem.deleteMany({
      where: { cart: { userId: session.user.id }, productId },
    });
    return;
  }

  const guest = await readGuestCart();
  await writeGuestCart(guest.filter((i) => i.productId !== productId));
}
