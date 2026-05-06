"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerVendorAction } from "@/server/actions/vendor";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Props = {
  counties: string[];
  defaultEmail: string;
};

export function VendorRegisterForm({ counties, defaultEmail }: Props) {
  const [state, formAction, pending] = useActionState(
    registerVendorAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" required disabled={pending} />
        {state?.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">What do you sell? (optional)</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className={`${inputClass} h-auto py-2`}
          placeholder="Tell customers about your shop, your products, and what makes you different."
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="contactEmail">Business email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={defaultEmail}
            required
            disabled={pending}
          />
          {state?.fieldErrors?.contactEmail && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.contactEmail[0]}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contactPhone">Business phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            placeholder="+254 712 345 678"
            required
            disabled={pending}
          />
          {state?.fieldErrors?.contactPhone && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.contactPhone[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="county">Primary county of operation</Label>
        <select
          id="county"
          name="county"
          required
          defaultValue=""
          className={inputClass}
          disabled={pending}
        >
          <option value="" disabled>
            Pick a county
          </option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.county && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.county[0]}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Payout details (M-Pesa Paybill / Till or bank account) are configured
        from your dashboard once your application is approved.
      </p>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
