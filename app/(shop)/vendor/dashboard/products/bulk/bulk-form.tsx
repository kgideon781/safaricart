"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  bulkCreateProductsAction,
  type BulkUploadResult,
} from "@/server/actions/vendor";

const initial: BulkUploadResult = null;

export function BulkUploadForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    bulkCreateProductsAction,
    initial,
  );

  const isErrorOnly = state && "error" in state;
  const result = state && "success" in state ? state : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isErrorOnly && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert variant={result.created === 0 ? "destructive" : undefined}>
          <AlertDescription>{result.success}</AlertDescription>
        </Alert>
      )}

      {result && result.rowErrors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">
            {result.rowErrors.length} row
            {result.rowErrors.length === 1 ? "" : "s"} skipped
          </p>
          <ul className="mt-2 max-h-64 space-y-2 overflow-auto">
            {result.rowErrors.map((err) => (
              <li key={err.row}>
                <span className="font-mono text-xs">Row {err.row}</span>
                <ul className="ml-4 list-disc text-xs text-muted-foreground">
                  {err.errors.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="file">CSV file</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          disabled={pending}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          Max 500 rows · 2 MB · UTF-8 encoded.
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Uploading…" : "Upload and import"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/vendor/dashboard/products")}
        >
          Cancel
        </Button>
        {result && result.created > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/vendor/dashboard/products")}
          >
            View products
          </Button>
        )}
      </div>
    </form>
  );
}
