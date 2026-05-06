import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { getFeaturedProducts } from "@/server/queries/catalog";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Trending now
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hand-picked deals from verified vendors across Kenya.
          </p>
        </div>
        <Link
          href="/products"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
