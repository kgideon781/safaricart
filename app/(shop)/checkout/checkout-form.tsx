"use client";

import { useActionState, useState } from "react";
import { CreditCard, Smartphone, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { placeOrderAction } from "@/server/actions/checkout";

type AddressOption = {
  id: string;
  label: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneE164: string;
  line1: string;
  line2: string;
  landmark: string | null;
  isDefault: boolean;
};

type Method = "MPESA" | "PAYSTACK" | "STRIPE" | "CASH_ON_DELIVERY";

const methods: {
  value: Method;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "MPESA",
    label: "M-Pesa",
    description: "Receive an STK push to your phone — confirm with your PIN.",
    icon: Smartphone,
  },
  {
    value: "PAYSTACK",
    label: "Card via Paystack",
    description: "Visa, Mastercard, Verve.",
    icon: CreditCard,
  },
  {
    value: "STRIPE",
    label: "International card via Stripe",
    description: "For non-Kenyan cards.",
    icon: Wallet,
  },
  {
    value: "CASH_ON_DELIVERY",
    label: "Cash on delivery",
    description: "Pay the courier when your order arrives.",
    icon: Truck,
  },
];

type Props = {
  addresses: AddressOption[];
  defaultAddressId: string;
  defaultEmail: string;
};

export function CheckoutForm({
  addresses,
  defaultAddressId,
  defaultEmail,
}: Props) {
  const [state, formAction, pending] = useActionState(placeOrderAction, null);

  const [selectedAddressId, setSelectedAddressId] =
    useState<string>(defaultAddressId);
  const [method, setMethod] = useState<Method>("MPESA");

  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) ?? addresses[0]!;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Hidden inputs that mirror the radio state */}
      <input type="hidden" name="addressId" value={selectedAddressId} />
      <input type="hidden" name="paymentMethod" value={method} />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Delivery address</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {addresses.map((addr) => (
              <li key={addr.id}>
                <label
                  className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                    selectedAddressId === addr.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <div className="flex-1 text-sm">
                    <div className="flex items-center gap-2">
                      {addr.label && (
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {addr.label}
                        </span>
                      )}
                      {addr.isDefault && (
                        <span className="text-xs text-secondary">Default</span>
                      )}
                    </div>
                    <p className="font-medium">{addr.recipientName}</p>
                    <p className="text-muted-foreground">{addr.recipientPhone}</p>
                    <p className="text-muted-foreground">{addr.line1}</p>
                    <p className="text-muted-foreground">{addr.line2}</p>
                    {addr.landmark && (
                      <p className="text-muted-foreground italic">
                        Landmark: {addr.landmark}
                      </p>
                    )}
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {state?.fieldErrors?.addressId && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.addressId[0]}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Payment method</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {methods.map((m) => {
              const Icon = m.icon;
              return (
                <li key={m.value}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      method === m.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentChoice"
                      value={m.value}
                      checked={method === m.value}
                      onChange={() => setMethod(m.value)}
                      className="mt-1 size-4 accent-primary"
                    />
                    <Icon className="mt-0.5 size-5 text-muted-foreground" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{m.label}</p>
                      <p className="text-muted-foreground">{m.description}</p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>

          {method === "MPESA" && (
            <div className="grid gap-2 rounded-md bg-muted/50 p-4">
              <Label htmlFor="mpesaPhone">M-Pesa phone number</Label>
              <Input
                id="mpesaPhone"
                name="mpesaPhone"
                type="tel"
                placeholder="+254 712 345 678"
                defaultValue={selectedAddress.recipientPhoneE164}
                required
              />
              {state?.fieldErrors?.mpesaPhone && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.mpesaPhone[0]}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                You'll receive an STK push to confirm payment with your M-Pesa
                PIN.
              </p>
            </div>
          )}

          {method === "PAYSTACK" && (
            <p className="rounded-md bg-muted/50 p-4 text-xs text-muted-foreground">
              You'll be redirected to Paystack to complete payment. Receipt sent
              to {defaultEmail}.
            </p>
          )}

          {method === "STRIPE" && (
            <p className="rounded-md bg-muted/50 p-4 text-xs text-muted-foreground">
              You'll be redirected to Stripe Checkout. Best for non-Kenyan cards.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Promo code</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="couponCode" className="sr-only">
            Coupon code
          </Label>
          <Input
            id="couponCode"
            name="couponCode"
            placeholder="Enter a code (optional)"
            autoCapitalize="characters"
            className="uppercase"
          />
          {state?.fieldErrors?.couponCode && (
            <p className="mt-2 text-xs text-destructive">
              {state.fieldErrors.couponCode[0]}
            </p>
          )}
        </CardContent>
      </Card>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Placing order…" : "Place order"}
      </Button>
    </form>
  );
}
