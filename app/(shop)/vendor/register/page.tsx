import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/server/auth";
import { db } from "@/server/db";
import { VendorRegisterForm } from "./register-form";
import { KENYAN_COUNTIES } from "@/lib/kenya";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Become a vendor" };

export default async function VendorRegisterPage() {
  const session = await requireSession("/vendor/register");

  // If already a vendor, jump to dashboard.
  const existing = await db.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) redirect("/vendor/dashboard");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            Become a SafariCart vendor
          </CardTitle>
          <CardDescription>
            Tell us about your business. We'll review your application and reach
            out within 1–3 business days. Once approved, your products go live
            and customers across Kenya can buy from you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorRegisterForm
            counties={[...KENYAN_COUNTIES]}
            defaultEmail={session.user.email ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
