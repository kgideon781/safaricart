import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireVendor } from "@/server/vendor";
import { getVendorProducts } from "@/server/queries/vendor";
import { deleteProductAction } from "@/server/actions/vendor";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Products" };

export default async function VendorProductsPage() {
  const { vendor } = await requireVendor("/vendor/dashboard/products");
  const products = await getVendorProducts(vendor.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products.length.toLocaleString("en-KE")} total
          </p>
        </div>
        <Link
          href="/vendor/dashboard/products/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="size-4" />
          New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <h3 className="font-heading text-lg font-semibold">No products yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first product to start selling.
          </p>
          <Link
            href="/vendor/dashboard/products/new"
            className={`${buttonVariants({ size: "sm" })} mt-4`}
          >
            Add a product
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
          {products.map((p) => {
            const image = p.images[0];
            return (
              <li
                key={p.id}
                className="flex items-center gap-4 p-4"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {image && (
                    <Image
                      src={image}
                      alt={p.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{p.title}</span>
                    {!p.isPublished && (
                      <Badge className="bg-muted text-muted-foreground">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.category.name} · Stock {p.stock}
                  </p>
                </div>
                <div className="hidden text-right md:block">
                  <span className="font-heading text-base font-bold text-primary">
                    {formatKES(p.priceKes)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/vendor/dashboard/products/${p.id}/edit`}
                    aria-label="Edit"
                    className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      aria-label="Delete"
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
