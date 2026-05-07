import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { isCloudinaryConfigured, signUpload } from "@/server/cloudinary";
import { rateLimit, clientIp } from "@/server/rate-limit";

export const runtime = "nodejs";

type Body = {
  folder?: "products" | "vendor" | "kyc";
  resourceType?: "image" | "raw" | "auto";
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isCloudinaryConfigured())) {
    return NextResponse.json({ error: "Uploads are not configured" }, { status: 503 });
  }

  const ip = await clientIp();
  const limit = await rateLimit({
    key: `upload-sign:${session.user.id}:${ip}`,
    max: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    /* allow empty body */
  }

  const folder = body.folder ?? "products";

  // Authorization per folder: only vendors can write to products/vendor/kyc;
  // admins can write anywhere.
  const role = session.user.role;
  if (role !== "VENDOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // For vendor folders, scope public_id prefix to this vendor so files are
  // attributable and can be cleaned up if the vendor is removed.
  let publicIdPrefix: string | undefined;
  if (role === "VENDOR") {
    const vendor = await db.vendor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 403 });
    }
    publicIdPrefix = `v_${vendor.id}`;
  }

  const payload = await signUpload({
    folder,
    resourceType: body.resourceType ?? "image",
    publicIdPrefix,
  });

  return NextResponse.json(payload);
}
