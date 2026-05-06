import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, MapPin, Star, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getProductBySlug } from "@/server/queries/catalog";
import { formatKES } from "@/lib/kenya";

type RouteParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.description.slice(0, 150),
  };
}

export default async function ProductPage({
  params,
}: {
  params: RouteParams;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

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
  const inStock = product.stock > 0;
  const primaryImage = product.images[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/category/${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
          {primaryImage && (
            <Image
              src={primaryImage}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
          {onSale && (
            <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">
              -{discountPct}%
            </Badge>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {product.title}
          </h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 text-accent">
              <Star className="size-4 fill-current" />
              <span className="font-medium text-foreground">
                {product.reviewCount === 0 ? "New" : product.rating.toFixed(1)}
              </span>
            </span>
            <span>·</span>
            <span>
              {product.reviewCount.toLocaleString("en-KE")} review
              {product.reviewCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-heading text-3xl font-bold text-primary">
              {formatKES(product.priceKes)}
            </span>
            {onSale && (
              <span className="text-base text-muted-foreground line-through">
                {formatKES(product.compareAtPriceKes!)}
              </span>
            )}
          </div>

          <div className="mt-2">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary">
                <span className="size-2 rounded-full bg-secondary" />
                In stock — {product.stock.toLocaleString("en-KE")} available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                <span className="size-2 rounded-full bg-destructive" />
                Out of stock
              </span>
            )}
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col gap-3">
            <Link
              href={`/vendor/${product.vendor.slug}`}
              className="group flex items-center gap-2 text-sm"
            >
              <span className="font-medium group-hover:text-primary">
                Sold by {product.vendor.name}
              </span>
              {product.isVendorVerified && (
                <span
                  title="Verified vendor"
                  className="inline-flex items-center gap-1 text-secondary"
                >
                  <BadgeCheck className="size-4" />
                  <span className="text-xs">Verified</span>
                </span>
              )}
            </Link>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {product.vendor.county}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Truck className="size-4" />
              Delivery to all 47 counties · M-Pesa accepted
            </span>
          </div>

          <Separator className="my-6" />

          {/* TODO: wire to cart server action in chunk 9 */}
          <div className="flex gap-3">
            <Button size="lg" className="flex-1" disabled={!inStock}>
              {inStock ? "Add to cart" : "Out of stock"}
            </Button>
            <Button size="lg" variant="outline" disabled={!inStock}>
              Buy now
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-bold">Description</h2>
        <p className="mt-3 max-w-3xl whitespace-pre-line text-muted-foreground">
          {product.description}
        </p>
      </section>

      {product.reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-2xl font-bold">Customer reviews</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {product.reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.user.name ?? "Anonymous"}</span>
                  <span className="flex items-center gap-0.5 text-accent">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </span>
                </div>
                {review.title && (
                  <h3 className="mt-2 font-heading font-semibold">
                    {review.title}
                  </h3>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {review.body}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {review.createdAt.toLocaleDateString("en-KE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
