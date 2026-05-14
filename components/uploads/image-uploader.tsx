"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SignPayload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: "image" | "raw" | "auto";
  publicIdPrefix?: string;
};

async function uploadOne(
  file: File,
  folder: "products" | "vendor" | "kyc" | "quotes",
): Promise<string> {
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!signRes.ok) {
    const json = (await signRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || "Could not start upload.");
  }
  const sig = (await signRes.json()) as SignPayload;

  const form = new FormData();
  form.set("file", file);
  form.set("api_key", sig.apiKey);
  form.set("timestamp", String(sig.timestamp));
  form.set("signature", sig.signature);
  form.set("folder", sig.folder);
  if (sig.publicIdPrefix) form.set("public_id_prefix", sig.publicIdPrefix);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`;
  const res = await fetch(uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${text}`);
  }
  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}

/**
 * Multi-image uploader. Submits a JSON-encoded array under `name` as a hidden
 * input so server actions can read it via `formData.get(name)`.
 */
export function ImageUploader({
  name,
  folder = "products",
  initialUrls = [],
  max = 8,
  label,
}: {
  name: string;
  folder?: "products" | "vendor" | "kyc" | "quotes";
  initialUrls?: string[];
  max?: number;
  label?: string;
}) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    if (urls.length + files.length > max) {
      setErr(`You can upload up to ${max} images.`);
      e.target.value = "";
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const next: string[] = [];
      for (const f of files) {
        next.push(await uploadOne(f, folder));
      }
      setUrls((prev) => [...prev, ...next]);
    } catch (caught) {
      setErr(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(idx: number) {
    setUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium">{label}</span>}
      <input type="hidden" name={name} value={JSON.stringify(urls)} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {urls.map((u, i) => (
          <div
            key={u}
            className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
          >
            <Image
              src={u}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 text-foreground shadow opacity-0 transition group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Primary
              </span>
            )}
          </div>
        ))}
        {urls.length < max && (
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="aspect-square h-auto flex-col gap-1"
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
            <span className="text-xs">{busy ? "Uploading…" : "Add image"}</span>
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onChange}
      />
      {err && <p className="text-xs text-destructive">{err}</p>}
      <p className="text-xs text-muted-foreground">
        First image is the primary. JPG, PNG, or WebP — up to {max} images.
      </p>
    </div>
  );
}

/** Single-image uploader used for vendor logo / cover. */
export function SingleImageUploader({
  name,
  folder = "vendor",
  initialUrl,
  label,
  aspect = "1/1",
}: {
  name: string;
  folder?: "products" | "vendor" | "kyc" | "quotes";
  initialUrl?: string | null;
  label?: string;
  aspect?: "1/1" | "16/9";
}) {
  const [url, setUrl] = useState<string>(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const next = await uploadOne(file, folder);
      setUrl(next);
    } catch (caught) {
      setErr(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium">{label}</span>}
      <input type="hidden" name={name} value={url} />
      <div
        className={`relative w-full overflow-hidden rounded-md border border-border bg-muted`}
        style={{ aspectRatio: aspect }}
      >
        {url ? (
          <Image src={url} alt="" fill sizes="50vw" className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Upload className="size-6" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy ? "Uploading…" : url ? "Replace" : "Upload"}
        </Button>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setUrl("")}
          >
            Remove
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
