"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SingleImageUploader } from "@/components/uploads/image-uploader";
import { updateVendorProfileAction } from "@/server/actions/vendor";
import { KENYAN_COUNTIES } from "@/lib/kenya";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Initial = {
  description: string | null;
  contactEmail: string;
  contactPhone: string;
  county: string;
  logoUrl: string | null;
  coverUrl: string | null;
  mpesaPaybill: string | null;
  mpesaTillNumber: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  kraPin: string | null;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const [state, formAction, pending] = useActionState(
    updateVendorProfileAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.success && (
        <Alert>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <SingleImageUploader
          name="logoUrl"
          folder="vendor"
          initialUrl={initial.logoUrl}
          label="Logo"
          aspect="1/1"
        />
        <SingleImageUploader
          name="coverUrl"
          folder="vendor"
          initialUrl={initial.coverUrl}
          label="Cover image"
          aspect="16/9"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">About your store</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial.description ?? ""}
          className={`${inputClass} h-auto py-2`}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={initial.contactEmail}
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
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            defaultValue={initial.contactPhone}
            required
            disabled={pending}
          />
          {state?.fieldErrors?.contactPhone && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.contactPhone[0]}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="county">County</Label>
          <select
            id="county"
            name="county"
            defaultValue={initial.county}
            className={inputClass}
            required
            disabled={pending}
          >
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="mt-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Payout details
        </h3>
        <p className="text-xs text-muted-foreground">
          Where SafariCart sends your payouts. Fill in M-Pesa or bank — at
          least one is required to receive money.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="mpesaPaybill">M-Pesa Paybill</Label>
            <Input
              id="mpesaPaybill"
              name="mpesaPaybill"
              defaultValue={initial.mpesaPaybill ?? ""}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mpesaTillNumber">M-Pesa Till</Label>
            <Input
              id="mpesaTillNumber"
              name="mpesaTillNumber"
              defaultValue={initial.mpesaTillNumber ?? ""}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bankName">Bank</Label>
            <Input
              id="bankName"
              name="bankName"
              defaultValue={initial.bankName ?? ""}
              placeholder="e.g. KCB, Equity"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bankAccountName">Account name</Label>
            <Input
              id="bankAccountName"
              name="bankAccountName"
              defaultValue={initial.bankAccountName ?? ""}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bankAccountNumber">Account number</Label>
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              defaultValue={initial.bankAccountNumber ?? ""}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="kraPin">KRA PIN</Label>
            <Input
              id="kraPin"
              name="kraPin"
              defaultValue={initial.kraPin ?? ""}
              placeholder="A001234567X"
              disabled={pending}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
