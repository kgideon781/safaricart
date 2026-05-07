"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletterAction } from "@/server/actions/marketing";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(
    subscribeNewsletterAction,
    null,
  );

  return (
    <div className="mt-6 max-w-sm">
      <form action={formAction} className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="h-10"
          disabled={pending}
        />
        <Button type="submit" className="h-10 shrink-0" disabled={pending}>
          {pending ? "…" : "Subscribe"}
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        {state?.success
          ? state.success
          : state?.error
            ? state.error
            : "Get weekly deals and new-vendor highlights. Unsubscribe anytime."}
      </p>
    </div>
  );
}
