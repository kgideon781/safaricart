"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCategoryAction } from "@/server/actions/admin";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(
    createCategoryAction,
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
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required disabled={pending} />
        {state?.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slug">Slug (optional — derived from name)</Label>
        <Input id="slug" name="slug" placeholder="auto" disabled={pending} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className={`${inputClass} h-auto py-2`}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://…"
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="sortOrder">Sort order</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={0}
          disabled={pending}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isFeatured"
          className="size-4 rounded border-input"
          disabled={pending}
        />
        Feature on the homepage
      </label>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating…" : "Create category"}
      </Button>
    </form>
  );
}
