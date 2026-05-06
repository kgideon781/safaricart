import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@/lib/kenya";
import type { MockProduct } from "@/lib/mock";

type ProductCardProps = {
  product: MockProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const onSale =
    product.compareAtPriceKes !== null &&
    product.compareAtPriceKes > product.priceKes;
  const discountPct = onSale
    ? Math.round(
        ((product.compareAtPriceKes! - product.priceKes) /
          product.compareAtPriceKes!) *
          100,
      )
    : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {onSale && (
          <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground">
            -{discountPct}%
          </Badge>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
        >
          {product.title}
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="font-heading text-lg font-bold text-primary">
            {formatKES(product.priceKes)}
          </span>
          {onSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatKES(product.compareAtPriceKes!)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 text-accent">
            <Star className="size-3.5 fill-current" />
            <span className="font-medium text-foreground">
              {product.rating.toFixed(1)}
            </span>
          </span>
          <span>·</span>
          <span>{product.reviewCount.toLocaleString("en-KE")} reviews</span>
        </div>

        <div className="mt-auto flex items-center gap-1 pt-2 text-xs text-muted-foreground">
          <Link
            href={`/vendor/${product.vendor.slug}`}
            className="truncate hover:text-foreground"
          >
            {product.vendor.name}
          </Link>
          {product.vendor.isVerified && (
            <span
              title="Verified vendor"
              className="inline-flex items-center text-secondary"
            >
              <BadgeCheck className="size-4" />
              <span className="sr-only">Verified vendor</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
