"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { decideQuoteRequestAction } from "@/server/actions/quotes";

const textareaClass =
  "h-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function DecisionForm({ quoteId }: { quoteId: string }) {
  const [state, formAction, pending] = useActionState(
    decideQuoteRequestAction,
    null,
  );
  const [showDecline, setShowDecline] = useState(false);

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

      {showDecline && (
        <div className="grid gap-2">
          <label htmlFor="reason" className="text-xs font-medium text-muted-foreground">
            Reason (optional)
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            placeholder="What about this quote didn't work?"
            className={textareaClass}
            disabled={pending}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!showDecline && (
          <>
            <Button
              type="submit"
              name="decision"
              value="accept"
              disabled={pending}
            >
              {pending ? "Sending…" : "Accept quote"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDecline(true)}
              disabled={pending}
            >
              Decline
            </Button>
          </>
        )}
        {showDecline && (
          <>
            <Button
              type="submit"
              name="decision"
              value="decline"
              variant="destructive"
              disabled={pending}
            >
              {pending ? "Sending…" : "Confirm decline"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDecline(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
