"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCampaignAction } from "@/server/actions/admin";

function isoLocal(date: Date): string {
  // Format as yyyy-MM-ddTHH:mm for datetime-local inputs.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CampaignForm({
  coupons,
}: {
  coupons: { id: string; code: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCampaignAction, null);

  const now = new Date();
  const inAWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="title">Title (admin-only)</Label>
        <Input
          id="title"
          name="title"
          required
          minLength={2}
          maxLength={120}
          placeholder="Black Friday 2026"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="message">Banner message</Label>
        <textarea
          id="message"
          name="message"
          required
          minLength={2}
          maxLength={280}
          rows={2}
          placeholder="Site-wide 30% off — use BLACKFRIDAY30 at checkout."
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="ctaLabel">CTA label (optional)</Label>
          <Input id="ctaLabel" name="ctaLabel" maxLength={40} placeholder="Shop the sale" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ctaHref">CTA link (optional)</Label>
          <Input id="ctaHref" name="ctaHref" maxLength={500} placeholder="/deals" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="couponId">Coupon (optional)</Label>
          <select
            id="couponId"
            name="couponId"
            defaultValue=""
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">— none —</option>
            {coupons.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="startsAt">Starts at</Label>
          <Input
            type="datetime-local"
            id="startsAt"
            name="startsAt"
            defaultValue={isoLocal(now)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="endsAt">Ends at</Label>
          <Input
            type="datetime-local"
            id="endsAt"
            name="endsAt"
            defaultValue={isoLocal(inAWeek)}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked /> Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isDismissible" defaultChecked /> Dismissible by visitor
        </label>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.fieldErrors && (
        <ul className="text-sm text-destructive">
          {Object.entries(state.fieldErrors).flatMap(([k, v]) =>
            (v ?? []).map((m, i) => <li key={`${k}-${i}`}>{m}</li>),
          )}
        </ul>
      )}
      {state?.success && <p className="text-sm text-secondary">{state.success}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Create campaign"}
      </Button>
    </form>
  );
}
