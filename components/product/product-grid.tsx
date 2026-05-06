import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/server/queries/catalog";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No products found.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
