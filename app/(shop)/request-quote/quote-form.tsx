"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUploader } from "@/components/uploads/image-uploader";
import { KENYAN_COUNTIES } from "@/lib/kenya";
import { createQuoteRequestAction } from "@/server/actions/quotes";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function QuoteRequestForm({
  defaultTitle = "",
  defaultPhone = "",
}: {
  defaultTitle?: string;
  defaultPhone?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createQuoteRequestAction,
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
        <Label htmlFor="title">What item are you looking for?</Label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultTitle}
          placeholder="e.g. Bose QuietComfort 45 headphones, black"
          required
          disabled={pending}
        />
        {state?.fieldErrors?.title && (
          <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Details</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Brand, model, size, colour, links to similar products… the more detail you give us, the better the quote."
          required
          className={`${inputClass} h-auto py-2`}
          disabled={pending}
        />
        {state?.fieldErrors?.description && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            defaultValue={1}
            required
            disabled={pending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="targetPriceKes">Target price (KES, optional)</Label>
          <Input
            id="targetPriceKes"
            name="targetPriceKes"
            type="number"
            min={1}
            placeholder="What you'd hope to pay"
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">
            Helps us decide whether we can source it within your budget.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            inputMode="tel"
            defaultValue={defaultPhone}
            placeholder="07XX XXX XXX"
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
          <Label htmlFor="preferredCounty">Delivery county (optional)</Label>
          <select
            id="preferredCounty"
            name="preferredCounty"
            defaultValue=""
            className={inputClass}
            disabled={pending}
          >
            <option value="">Anywhere in Kenya</option>
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ImageUploader
        name="imageUrls"
        folder="quotes"
        max={4}
        label="Reference photos (optional)"
      />
      {state?.fieldErrors?.imageUrls && (
        <p className="text-xs text-destructive">
          {state.fieldErrors.imageUrls[0]}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit request"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
