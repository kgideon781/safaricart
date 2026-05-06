import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { requireSession } from "@/server/auth";
import { getOrderByNumberForUser } from "@/server/queries/orders";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Order placed" };

type RouteParams = Promise<{ orderNumber: string }>;

const paymentInstructions: Record<string, string> = {
  MPESA:
    "Check your phone — we've sent an M-Pesa STK push. Enter your PIN to complete payment.",
  PAYSTACK: "Complete payment via the Paystack link sent to your email.",
  STRIPE: "Complete payment in the Stripe Checkout window.",
  CASH_ON_DELIVERY: "Pay the courier in cash when your order arrives.",
};

export default async function OrderSuccessPage({
  params,
}: {
  params: RouteParams;
}) {
  const { orderNumber } = await params;
  const session = await requireSession(`/checkout/success/${orderNumber}`);
  const order = await getOrderByNumberForUser(orderNumber, session.user.id);
  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 md:px-6">
      <div className="flex flex-col items-center text-center">
        <div className="grid size-16 place-items-center rounded-full bg-secondary/10 text-secondary">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Thanks for your order!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Order <span className="font-medium text-foreground">{order.orderNumber}</span> is
          confirmed.
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Next step</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {paymentInstructions[order.paymentMethod]}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ul className="flex flex-col gap-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.quantity}× {item.productTitle}{" "}
                  <span className="text-muted-foreground">
                    · {item.vendor.name}
                  </span>
                </span>
                <span className="font-medium">{formatKES(item.subtotalKes)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatKES(order.subtotalKes)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>
                {order.shippingFeeKes === 0
                  ? "Free"
                  : formatKES(order.shippingFeeKes)}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2">
              <span className="font-heading text-base font-semibold">Total</span>
              <span className="font-heading text-lg font-bold text-primary">
                {formatKES(order.totalKes)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center gap-3">
        <Link
          href={`/account/orders/${order.orderNumber}`}
          className={buttonVariants({ size: "sm" })}
        >
          View order details
        </Link>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
