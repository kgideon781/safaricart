"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitContactAction } from "@/server/actions/marketing";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Your name</span>
          <Input name="name" required minLength={2} maxLength={100} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Email</span>
          <Input name="email" type="email" required />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Subject</span>
        <Input name="subject" required minLength={2} maxLength={150} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Message</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary"
        />
      </label>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-secondary">{state.success}</p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
