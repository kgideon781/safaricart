import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/server/queries/admin";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Admin · Products" };

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-bold">Products</h2>
        <p className="text-sm text-muted-foreground">
          Showing the {products.length} most recent products.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {products.map((p) => {
          const image = p.images[0];
          return (
            <li key={p.id} className="flex items-center gap-4 p-4">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {image && (
                  <Image
                    src={image}
                    alt={p.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/product/${p.slug}`}
                    className="truncate font-medium hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  {!p.isPublished && (
                    <Badge className="bg-muted text-muted-foreground">Draft</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.vendor.name} · {p.category.name} · Stock {p.stock}
                </p>
              </div>
              <span className="font-heading font-bold text-primary">
                {formatKES(p.priceKes)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
