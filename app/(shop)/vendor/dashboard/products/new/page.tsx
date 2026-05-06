import type { Metadata } from "next";
import { requireVendor } from "@/server/vendor";
import { db } from "@/server/db";
import { ProductForm } from "../product-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireVendor("/vendor/dashboard/products/new");
  const categories = await db.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Add a product</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductForm mode="create" categories={categories} />
      </CardContent>
    </Card>
  );
}
