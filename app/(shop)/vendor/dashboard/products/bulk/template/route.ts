import { requireVendor } from "@/server/vendor";
import { db } from "@/server/db";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const HEADERS = [
  "title",
  "description",
  "categorySlug",
  "priceKes",
  "compareAtPriceKes",
  "stock",
  "weightGrams",
  "sku",
  "imageUrls",
  "isPublished",
];

const EXAMPLE_ROW = [
  "Maasai beaded sandals",
  "Hand-stitched leather sandals with traditional beadwork.",
  "fashion",
  "1500",
  "2000",
  "10",
  "300",
  "MBS-001",
  "https://example.com/a.jpg;https://example.com/b.jpg",
  "true",
];

export async function GET() {
  await requireVendor("/vendor/dashboard/products/bulk");

  const categories = await db.category.findMany({
    where: { parentId: null },
    select: { slug: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  // The header line is what the importer parses. The leading comment lines
  // (Excel ignores `#`-prefixed rows in the first column when the cell is the
  // only data) act as inline documentation for vendors. We re-skip them on
  // import by checking for a `#` prefix on column 1.
  const docRows: string[][] = [
    [`# SafariCart product import — fill in one row per product, then upload this file.`],
    [`# Columns marked (required): title, description, categorySlug, priceKes.`],
    [`# imageUrls: separate multiple URLs with a semicolon (;). Up to 8.`],
    [`# isPublished: true or false. Defaults to true.`],
    [`# Valid categorySlug values: ${categories.map((c) => c.slug).join(", ")}`],
    [],
    HEADERS,
    EXAMPLE_ROW,
  ];

  const body = "﻿" + toCsv(docRows); // BOM so Excel opens UTF-8 cleanly

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="safaricart-products-template.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
