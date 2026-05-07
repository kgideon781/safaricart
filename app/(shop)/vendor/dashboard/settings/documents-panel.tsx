"use client";

import { useActionState, useRef, useState } from "react";
import { ExternalLink, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  addVendorDocumentAction,
  deleteVendorDocumentAction,
} from "@/server/actions/vendor";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

const TYPES = [
  { value: "NATIONAL_ID", label: "National ID / Passport" },
  { value: "BUSINESS_CERTIFICATE", label: "Business registration certificate" },
  { value: "KRA_PIN_CERTIFICATE", label: "KRA PIN certificate" },
  { value: "BANK_STATEMENT", label: "Bank statement" },
  { value: "OTHER", label: "Other" },
] as const;

type Doc = {
  id: string;
  type: string;
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  createdAt: string;
};

const docStatusVariant = {
  PENDING: "bg-accent text-accent-foreground",
  APPROVED: "bg-secondary text-secondary-foreground",
  REJECTED: "bg-destructive text-destructive-foreground",
} as const;

async function uploadKyc(file: File): Promise<string> {
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "kyc", resourceType: "auto" }),
  });
  if (!signRes.ok) {
    const json = (await signRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || "Could not start upload.");
  }
  const sig = (await signRes.json()) as {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
    resourceType: "image" | "raw" | "auto";
    publicIdPrefix?: string;
  };
  const form = new FormData();
  form.set("file", file);
  form.set("api_key", sig.apiKey);
  form.set("timestamp", String(sig.timestamp));
  form.set("signature", sig.signature);
  form.set("folder", sig.folder);
  if (sig.publicIdPrefix) form.set("public_id_prefix", sig.publicIdPrefix);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) throw new Error("Upload failed");
  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}

export function DocumentsPanel({ documents }: { documents: Doc[] }) {
  const [state, formAction, pending] = useActionState(addVendorDocumentAction, null);
  const [busy, setBusy] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const url = await uploadKyc(f);
      setFileUrl(url);
    } catch (caught) {
      setErr(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Upload identity and business documents so SafariCart can verify your
        store. Files are stored privately and only reviewed by our team.
      </p>

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
      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <form
        action={formAction}
        className="grid items-end gap-3 rounded-md border border-border p-3 md:grid-cols-[1fr_auto_auto]"
      >
        <div className="grid gap-2">
          <Label htmlFor="type">Document type</Label>
          <select id="type" name="type" defaultValue="NATIONAL_ID" className={inputClass}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="fileUrl" value={fileUrl} />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {fileUrl ? "Replace file" : "Choose file"}
        </Button>
        <Button type="submit" disabled={pending || busy || !fileUrl}>
          {pending ? "Submitting…" : "Submit"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={pick}
        />
        {fileUrl && (
          <p className="text-xs text-muted-foreground md:col-span-3">
            File ready — click Submit to send for review.
          </p>
        )}
        {state?.fieldErrors?.fileUrl && (
          <p className="text-xs text-destructive md:col-span-3">
            {state.fieldErrors.fileUrl[0]}
          </p>
        )}
      </form>

      {documents.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center gap-2 p-3 text-sm"
            >
              <Badge className={docStatusVariant[d.status]}>{d.status}</Badge>
              <span className="font-medium">{d.type.replace(/_/g, " ")}</span>
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View <ExternalLink className="inline size-3" />
              </a>
              <span className="text-xs text-muted-foreground">
                {new Date(d.createdAt).toLocaleDateString("en-KE", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {d.notes && (
                <span className="text-xs text-destructive">— {d.notes}</span>
              )}
              {d.status !== "APPROVED" && (
                <form action={deleteVendorDocumentAction} className="ml-auto">
                  <input type="hidden" name="id" value={d.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    Remove
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
