import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireVendor } from "@/server/vendor";
import { getVendorProduct } from "@/server/queries/vendor";
import { db } from "@/server/db";
import { ProductForm } from "../../product-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Edit product" };

type RouteParams = Promise<{ id: string }>;

export default async function EditProductPage({
  params,
}: {
  params: RouteParams;
}) {
  const { id } = await params;
  const { vendor } = await requireVendor(`/vendor/dashboard/products/${id}/edit`);
  const product = await getVendorProduct(vendor.id, id);
  if (!product) notFound();

  const categories = await db.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Edit product</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductForm
          mode="edit"
          categories={categories}
          initial={{
            id: product.id,
            title: product.title,
            description: product.description,
            categoryId: product.categoryId,
            priceKes: product.priceKes,
            compareAtPriceKes: product.compareAtPriceKes,
            stock: product.stock,
            weightGrams: product.weightGrams,
            images: product.images,
            isPublished: product.isPublished,
          }}
        />
      </CardContent>
    </Card>
  );
}
