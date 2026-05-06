"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateProfileAction } from "@/server/actions/account";

type Props = {
  email: string;
  name: string;
  phone: string;
};

export function ProfileForm({ email, name, phone }: Props) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled readOnly />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={name}
          autoComplete="name"
          required
          disabled={pending}
        />
        {state?.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          placeholder="+254 712 345 678"
          autoComplete="tel"
          disabled={pending}
        />
        {state?.fieldErrors?.phone && (
          <p className="text-xs text-destructive">{state.fieldErrors.phone[0]}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Used for order updates via SMS. Optional.
        </p>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
