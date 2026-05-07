import Link from "next/link";
import { Tag } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { getDealsProducts } from "@/server/queries/catalog";

export async function HotDeals() {
  const result = await getDealsProducts({ page: 1, perPage: 4 });
  if (result.items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
            <Tag className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Hot deals
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Discounted across vendors. Here today, sold out tomorrow.
            </p>
          </div>
        </div>
        <Link
          href="/deals"
          className="text-sm font-medium text-primary hover:underline"
        >
          See all deals
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {result.items.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
