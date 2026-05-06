"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerAction, googleLoginAction } from "@/server/actions/auth";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <div className="flex flex-col gap-4">
      {googleEnabled && (
        <>
          <form action={googleLoginAction}>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={pending}
            >
              Continue with Google
            </Button>
          </form>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={pending}
          />
          {state?.fieldErrors?.name && (
            <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
          />
          {state?.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={pending}
          />
          {state?.fieldErrors?.password && (
            <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
          )}
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
