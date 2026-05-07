import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryConfig } from "@/server/integrations";

/**
 * Configure the Cloudinary SDK from the active config (DB-first, env-fallback).
 * Cloudinary's SDK is mutated globally — to keep behaviour predictable when
 * an admin changes creds, we re-apply the config on each call rather than
 * caching at module scope.
 */
async function ensureConfigured() {
  const { config } = await getCloudinaryConfig();
  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
  return config;
}

export async function isCloudinaryConfigured(): Promise<boolean> {
  const { config } = await getCloudinaryConfig();
  return Boolean(config.cloudName && config.apiKey && config.apiSecret);
}

/**
 * Build a signed upload payload that the browser can POST directly to
 * Cloudinary. The server signs the parameters with our secret; only those
 * exact parameters can be used in the upload.
 */
export async function signUpload(opts: {
  folder: "products" | "vendor" | "kyc";
  resourceType?: "image" | "raw" | "auto";
  publicIdPrefix?: string;
}): Promise<{
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: "image" | "raw" | "auto";
  publicIdPrefix?: string;
}> {
  const config = await ensureConfigured();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${config.uploadFolder}/${opts.folder}`;
  const params: Record<string, string | number> = { folder, timestamp };
  if (opts.publicIdPrefix) params.public_id_prefix = opts.publicIdPrefix;

  const signature = cloudinary.utils.api_sign_request(params, config.apiSecret!);

  return {
    cloudName: config.cloudName!,
    apiKey: config.apiKey!,
    timestamp,
    signature,
    folder,
    resourceType: opts.resourceType ?? "image",
    publicIdPrefix: opts.publicIdPrefix,
  };
}

export async function destroyAsset(
  publicId: string,
  resourceType: "image" | "raw" = "image",
) {
  await ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/** Used by /admin/integrations to validate credentials. */
export async function testCloudinaryConnection(opts: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    cloudinary.config({
      cloud_name: opts.cloudName,
      api_key: opts.apiKey,
      api_secret: opts.apiSecret,
      secure: true,
    });
    const ping = (await cloudinary.api.ping()) as { status?: string };
    if (ping.status !== "ok") {
      return { ok: false, reason: "Cloudinary did not return ok" };
    }
    return { ok: true };
  } catch (err) {
    // The SDK throws non-Error objects shaped { error: { message, http_code } }
    // for auth failures, plus regular Errors for network problems.
    const e = err as {
      error?: { message?: string; http_code?: number };
      message?: string;
    };
    const message =
      e?.error?.message ||
      e?.message ||
      (typeof err === "string" ? err : JSON.stringify(err));
    const code = e?.error?.http_code ? ` (HTTP ${e.error.http_code})` : "";
    return { ok: false, reason: `${message}${code}` };
  }
}
