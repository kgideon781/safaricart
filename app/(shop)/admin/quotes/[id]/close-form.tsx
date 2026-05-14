"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { closeQuoteRequestAction } from "@/server/actions/quotes";

const textareaClass =
  "h-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CloseForm({ quoteId }: { quoteId: string }) {
  const [state, formAction, pending] = useActionState(
    closeQuoteRequestAction,
    null,
  );
  const [open, setOpen] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-3">
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

      {!open && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={pending}
        >
          Close this request
        </Button>
      )}

      {open && (
        <>
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-xs font-medium text-muted-foreground">
              Reason (shown to customer)
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              placeholder="e.g. We can't source this item locally."
              className={textareaClass}
              disabled={pending}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Closing…" : "Confirm close"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
