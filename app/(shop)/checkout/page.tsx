import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, MapPin } from "lucide-react";
import { requireSession } from "@/server/auth";
import { getUserAddresses } from "@/server/queries/account";
import { getCart } from "@/server/cart";
import { CheckoutForm } from "./checkout-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatKES, formatKenyanPhone } from "@/lib/kenya";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await requireSession("/checkout");
  const cart = await getCart();
  if (cart.items.length === 0) redirect("/cart");

  const addresses = await getUserAddresses(session.user.id);

  if (addresses.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12 md:px-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Add a delivery address
        </h1>
        <p className="mt-2 text-muted-foreground">
          We need somewhere to ship your order before checkout.
        </p>
        <Link
          href="/account/addresses/new"
          className={`${buttonVariants({ size: "lg" })} mt-6`}
        >
          Add address
        </Link>
      </div>
    );
  }

  const subtotalKes = cart.subtotalKes;
  const shippingFeeKes = subtotalKes >= 5000 ? 0 : 350;
  const totalKes = subtotalKes + shippingFeeKes;

  const defaultAddressId =
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]!.id;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <Link
        href="/cart"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to cart
      </Link>

      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight md:text-4xl">
        Checkout
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <CheckoutForm
          addresses={addresses.map((a) => ({
            id: a.id,
            label: a.label,
            recipientName: a.recipientName,
            recipientPhone: formatKenyanPhone(a.recipientPhone),
            recipientPhoneE164: a.recipientPhone,
            line1: a.streetAddress,
            line2: [a.ward, a.subCounty, a.county].filter(Boolean).join(", "),
            landmark: a.landmark,
            isDefault: a.isDefault,
          }))}
          defaultAddressId={defaultAddressId}
          defaultEmail={session.user.email ?? ""}
        />

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="font-heading">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2 text-sm">
              {cart.items.map((item) => (
                <li
                  key={item.productId}
                  className="flex justify-between gap-2"
                >
                  <span className="line-clamp-1">
                    {item.quantity}× {item.title}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatKES(item.lineTotalKes)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatKES(subtotalKes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shippingFeeKes === 0 ? "Free" : formatKES(shippingFeeKes)}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                <span className="font-heading text-lg font-semibold">Total</span>
                <span className="font-heading text-xl font-bold text-primary">
                  {formatKES(totalKes)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
