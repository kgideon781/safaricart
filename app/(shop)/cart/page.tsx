import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCart } from "@/server/cart";
import {
  removeFromCartAction,
  updateCartQuantityAction,
} from "@/server/actions/cart";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center md:px-6">
        <div className="grid size-16 place-items-center rounded-full bg-muted">
          <ShoppingBag className="size-8 text-muted-foreground" />
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Your cart is empty
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Looks like you haven't added anything yet. Browse trending products and
          start your shopping journey.
        </p>
        <Link
          href="/"
          className={`${buttonVariants({ size: "lg" })} mt-6`}
        >
          Browse products
        </Link>
      </div>
    );
  }

  const shippingFeeKes = cart.subtotalKes >= 5000 ? 0 : 350;
  const totalKes = cart.subtotalKes + shippingFeeKes;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
        Your cart
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {cart.itemCount.toLocaleString("en-KE")} item
        {cart.itemCount === 1 ? "" : "s"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col gap-3">
          {cart.items.map((item) => {
            const overStock = item.quantity > item.stock;
            return (
              <li
                key={item.productId}
                className="flex gap-4 rounded-lg border border-border bg-card p-4"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative aspect-square size-24 shrink-0 overflow-hidden rounded-md bg-muted"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </Link>

                <div className="flex flex-1 flex-col">
                  <Link
                    href={`/product/${item.slug}`}
                    className="line-clamp-2 text-sm font-medium hover:text-primary"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sold by {item.vendorName}
                  </p>
                  {overStock && (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      Only {item.stock} in stock
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <form
                      action={updateCartQuantityAction}
                      className="flex items-center gap-1 rounded-md border border-border"
                    >
                      <input
                        type="hidden"
                        name="productId"
                        value={item.productId}
                      />
                      <button
                        type="submit"
                        name="quantity"
                        value={item.quantity - 1}
                        aria-label="Decrease quantity"
                        className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="submit"
                        name="quantity"
                        value={item.quantity + 1}
                        aria-label="Increase quantity"
                        disabled={item.quantity >= item.stock || item.quantity >= 99}
                        className="grid size-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        +
                      </button>
                    </form>

                    <form action={removeFromCartAction}>
                      <input
                        type="hidden"
                        name="productId"
                        value={item.productId}
                      />
                      <button
                        type="submit"
                        aria-label={`Remove ${item.title}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </button>
                    </form>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between text-right">
                  <span className="font-heading text-base font-bold text-primary">
                    {formatKES(item.lineTotalKes)}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {formatKES(item.unitPriceKes)} each
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="font-heading">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatKES(cart.subtotalKes)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {shippingFeeKes === 0 ? "Free" : formatKES(shippingFeeKes)}
              </span>
            </div>
            {shippingFeeKes > 0 && (
              <p className="text-xs text-muted-foreground">
                Add {formatKES(5000 - cart.subtotalKes)} more for free delivery.
              </p>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-heading text-lg font-semibold">Total</span>
              <span className="font-heading text-xl font-bold text-primary">
                {formatKES(totalKes)}
              </span>
            </div>
            {/* TODO: wire to /checkout in chunk 12 */}
            <Button size="lg" className="mt-3 w-full" disabled>
              Proceed to checkout
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Pay with M-Pesa, card, or cash on delivery.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
