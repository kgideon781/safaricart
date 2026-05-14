import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { isCloudinaryConfigured, signUpload } from "@/server/cloudinary";
import { rateLimit, clientIp } from "@/server/rate-limit";

export const runtime = "nodejs";

type Body = {
  folder?: "products" | "vendor" | "kyc" | "quotes";
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

  // Authorization per folder:
  //   - products/vendor/kyc: vendors and admins
  //   - quotes: any logged-in customer (reference images on a quote request)
  const role = session.user.role;
  if (folder === "quotes") {
    // Any signed-in user may attach images to their quote request.
  } else if (role !== "VENDOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Scope public_id prefix so files are attributable and can be cleaned up.
  let publicIdPrefix: string | undefined;
  if (folder === "quotes") {
    publicIdPrefix = `u_${session.user.id}`;
  } else if (role === "VENDOR") {
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
