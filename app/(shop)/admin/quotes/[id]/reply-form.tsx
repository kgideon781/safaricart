"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { replyQuoteRequestAction } from "@/server/actions/quotes";

const textareaClass =
  "h-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ReplyForm({
  quoteId,
  initial,
}: {
  quoteId: string;
  initial: { priceKes: number | null; leadTime: string; notes: string };
}) {
  const [state, formAction, pending] = useActionState(
    replyQuoteRequestAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={quoteId} />

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.success && (
        <Alert>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="priceKes">Quoted price (KES)</Label>
          <Input
            id="priceKes"
            name="priceKes"
            type="number"
            min={1}
            defaultValue={initial.priceKes ?? ""}
            required
            disabled={pending}
          />
          {state?.fieldErrors?.priceKes && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.priceKes[0]}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="leadTime">Lead time</Label>
          <Input
            id="leadTime"
            name="leadTime"
            defaultValue={initial.leadTime}
            placeholder="e.g. 3–5 business days"
            disabled={pending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="validDays">Valid for (days)</Label>
          <Input
            id="validDays"
            name="validDays"
            type="number"
            min={1}
            max={60}
            defaultValue={7}
            disabled={pending}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes for the customer (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={initial.notes}
          placeholder="Anything the customer should know — sourcing details, colour caveats, etc."
          className={textareaClass}
          disabled={pending}
        />
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send quote to customer"}
        </Button>
      </div>
    </form>
  );
}
