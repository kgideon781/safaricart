import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireVendor } from "@/server/vendor";
import { db } from "@/server/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BulkUploadForm } from "./bulk-form";

export const metadata: Metadata = { title: "Bulk upload products" };

export default async function BulkProductsPage() {
  await requireVendor("/vendor/dashboard/products/bulk");
  const categories = await db.category.findMany({
    where: { parentId: null },
    select: { slug: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Bulk upload products</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <p className="font-medium">How it works</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              Download the template — it includes column headers and an
              example row.
            </li>
            <li>
              Fill in one row per product. Required columns:{" "}
              <code>title</code>, <code>description</code>,{" "}
              <code>categorySlug</code>, <code>priceKes</code>.
            </li>
            <li>
              For <code>imageUrls</code>, paste image URLs separated by a
              semicolon (<code>;</code>). Up to 8.
            </li>
            <li>Save as CSV and upload below (max 500 rows, 2 MB).</li>
          </ol>
          <div className="mt-4">
            <Link
              href="/vendor/dashboard/products/bulk/template"
              prefetch={false}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Download className="size-4" />
              Download CSV template
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 text-sm">
          <p className="font-medium">Valid <code>categorySlug</code> values</p>
          <ul className="mt-2 flex flex-wrap gap-2 text-muted-foreground">
            {categories.map((c) => (
              <li
                key={c.slug}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-xs"
              >
                <span className="font-mono">{c.slug}</span>
                <span className="ml-1 opacity-70">— {c.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <BulkUploadForm />
      </CardContent>
    </Card>
  );
}
