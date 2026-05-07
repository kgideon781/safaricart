"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCouponAction } from "@/server/actions/admin";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Vendor = { id: string; name: string };

export function CouponForm({ vendors }: { vendors: Vendor[] }) {
  const [state, formAction, pending] = useActionState(createCouponAction, null);
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      {state?.success && (
        <div className="md:col-span-2">
          <Alert>
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        </div>
      )}
      {state?.error && (
        <div className="md:col-span-2">
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          placeholder="JAMHURI10"
          required
          className="uppercase"
          autoCapitalize="characters"
          disabled={pending}
        />
        {state?.fieldErrors?.code && (
          <p className="text-xs text-destructive">{state.fieldErrors.code[0]}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          className={inputClass}
          value={type}
          onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
          disabled={pending}
        >
          <option value="PERCENT">Percentage off</option>
          <option value="FIXED">Fixed KES off</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="value">{type === "PERCENT" ? "Percent (1–100)" : "Amount (KES)"}</Label>
        <Input
          id="value"
          name="value"
          type="number"
          min={1}
          max={type === "PERCENT" ? 100 : undefined}
          required
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="minSubtotalKes">Minimum subtotal (KES)</Label>
        <Input
          id="minSubtotalKes"
          name="minSubtotalKes"
          type="number"
          min={0}
          defaultValue={0}
          disabled={pending}
        />
      </div>

      {type === "PERCENT" && (
        <div className="grid gap-2">
          <Label htmlFor="maxDiscountKes">Cap discount at (KES, optional)</Label>
          <Input
            id="maxDiscountKes"
            name="maxDiscountKes"
            type="number"
            min={1}
            disabled={pending}
          />
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="vendorId">Vendor scope (optional)</Label>
        <select
          id="vendorId"
          name="vendorId"
          className={inputClass}
          defaultValue=""
          disabled={pending}
        >
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="maxUses">Total uses cap (optional)</Label>
        <Input id="maxUses" name="maxUses" type="number" min={1} disabled={pending} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="perUserLimit">Per-customer limit (optional)</Label>
        <Input
          id="perUserLimit"
          name="perUserLimit"
          type="number"
          min={1}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="expiresAt">Expires (optional)</Label>
        <Input
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
          disabled={pending}
        />
      </div>

      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked
          className="size-4 rounded border-input"
          disabled={pending}
        />
        Active immediately
      </label>

      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create coupon"}
        </Button>
      </div>
    </form>
  );
}
