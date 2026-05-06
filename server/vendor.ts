import "server-only";
import { redirect } from "next/navigation";
import { auth, requireSession } from "@/server/auth";
import { db } from "@/server/db";

export async function getMyVendor() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.vendor.findUnique({ where: { userId: session.user.id } });
}

export async function requireVendor(callbackUrl?: string) {
  const session = await requireSession(callbackUrl);
  const vendor = await db.vendor.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/vendor/register");
  return { session, vendor };
}
