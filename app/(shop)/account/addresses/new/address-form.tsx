"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAddressAction } from "@/server/actions/account";

type Props = {
  counties: string[];
};

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AddressForm({ counties }: Props) {
  const [state, formAction, pending] = useActionState(createAddressAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="label">Label (optional)</Label>
        <Input
          id="label"
          name="label"
          placeholder="Home, Work, Mum's place…"
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="recipientName">Recipient name</Label>
          <Input
            id="recipientName"
            name="recipientName"
            autoComplete="name"
            required
            disabled={pending}
          />
          {state?.fieldErrors?.recipientName && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.recipientName[0]}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="recipientPhone">Phone number</Label>
          <Input
            id="recipientPhone"
            name="recipientPhone"
            type="tel"
            placeholder="+254 712 345 678"
            autoComplete="tel"
            required
            disabled={pending}
          />
          {state?.fieldErrors?.recipientPhone && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.recipientPhone[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="county">County</Label>
          <select
            id="county"
            name="county"
            required
            defaultValue=""
            disabled={pending}
            className={inputClass}
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

        <div className="grid gap-2">
          <Label htmlFor="subCounty">Sub-county / Town</Label>
          <Input id="subCounty" name="subCounty" disabled={pending} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="ward">Ward / Estate (optional)</Label>
          <Input id="ward" name="ward" disabled={pending} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="landmark">Landmark (optional)</Label>
          <Input
            id="landmark"
            name="landmark"
            placeholder="Near the petrol station…"
            disabled={pending}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="streetAddress">Street address</Label>
        <Input
          id="streetAddress"
          name="streetAddress"
          autoComplete="street-address"
          required
          disabled={pending}
        />
        {state?.fieldErrors?.streetAddress && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.streetAddress[0]}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          className="size-4 rounded border-input"
          disabled={pending}
        />
        Set as default delivery address
      </label>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save address"}
      </Button>
    </form>
  );
}
