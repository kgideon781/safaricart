import type { Metadata } from "next";
import { requireVendor } from "@/server/vendor";
import { db } from "@/server/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { DocumentsPanel } from "./documents-panel";
import { vendorPayableKes } from "@/server/payouts";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Vendor settings" };

export default async function VendorSettingsPage() {
  const { vendor } = await requireVendor("/vendor/dashboard/settings");
  const [documents, payable] = await Promise.all([
    db.vendorDocument.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
    }),
    vendorPayableKes(vendor.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Public profile, contact details, payout method and KYC documents.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unpaid balance</p>
          <p className="font-heading text-3xl font-bold">{formatKES(payable)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Earnings credit when an item is delivered (or when its order is
            paid). Payouts are settled by SafariCart on a weekly schedule.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Public profile & payout</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              description: vendor.description,
              contactEmail: vendor.contactEmail,
              contactPhone: vendor.contactPhone,
              county: vendor.county,
              logoUrl: vendor.logoUrl,
              coverUrl: vendor.coverUrl,
              mpesaPaybill: vendor.mpesaPaybill,
              mpesaTillNumber: vendor.mpesaTillNumber,
              bankName: vendor.bankName,
              bankAccountName: vendor.bankAccountName,
              bankAccountNumber: vendor.bankAccountNumber,
              kraPin: vendor.kraPin,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">KYC documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentsPanel
            documents={documents.map((d) => ({
              id: d.id,
              type: d.type,
              fileUrl: d.fileUrl,
              status: d.status,
              notes: d.notes,
              createdAt: d.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
