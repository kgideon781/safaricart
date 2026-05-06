"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createProductAction,
  updateProductAction,
} from "@/server/actions/vendor";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type CategoryOption = { id: string; name: string };

type Initial = {
  id?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  priceKes?: number;
  compareAtPriceKes?: number | null;
  stock?: number;
  weightGrams?: number | null;
  images?: string[];
  isPublished?: boolean;
};

type Props = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  initial?: Initial;
};

export function ProductForm({ mode, categories, initial = {} }: Props) {
  const router = useRouter();
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState(action, null);

  const imagesText = (initial.images ?? []).join("\n");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "edit" && initial.id && (
        <input type="hidden" name="id" value={initial.id} />
      )}

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
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initial.title}
          required
          disabled={pending}
        />
        {state?.fieldErrors?.title && (
          <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initial.description}
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
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={initial.categoryId ?? ""}
            className={inputClass}
            disabled={pending}
          >
            <option value="" disabled>
              Pick a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.categoryId && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.categoryId[0]}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={initial.stock ?? 0}
            disabled={pending}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="priceKes">Price (KES)</Label>
          <Input
            id="priceKes"
            name="priceKes"
            type="number"
            min={1}
            defaultValue={initial.priceKes}
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
          <Label htmlFor="compareAtPriceKes">
            Compare-at price (optional, KES)
          </Label>
          <Input
            id="compareAtPriceKes"
            name="compareAtPriceKes"
            type="number"
            min={1}
            defaultValue={initial.compareAtPriceKes ?? ""}
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">
            Original price — shows a strike-through and a discount badge.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="weightGrams">Weight (grams, optional)</Label>
        <Input
          id="weightGrams"
          name="weightGrams"
          type="number"
          min={1}
          defaultValue={initial.weightGrams ?? ""}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          Used to estimate shipping fees.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="imagesText">Image URLs (one per line, max 8)</Label>
        <textarea
          id="imagesText"
          name="imagesText"
          rows={4}
          defaultValue={imagesText}
          placeholder={"https://example.com/photo.jpg\nhttps://example.com/photo2.jpg"}
          className={`${inputClass} h-auto py-2 font-mono text-xs`}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          Image hosting integration is coming soon. For now, paste public URLs.
          The first URL is used as the primary image.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={initial.isPublished ?? false}
          className="size-4 rounded border-input"
          disabled={pending}
        />
        Publish to the catalog (uncheck to save as draft)
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/vendor/dashboard/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
