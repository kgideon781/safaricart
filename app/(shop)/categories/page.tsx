import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCategoryListWithCounts } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "All categories",
  description: "Browse every product category on SafariCart.",
};

export default async function CategoriesIndexPage() {
  const categories = await getCategoryListWithCounts();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          All categories
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse every product category on SafariCart.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary"
          >
            <div className="relative aspect-[4/3] bg-muted">
              {c.imageUrl ? (
                <Image
                  src={c.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-1 p-4">
              <span className="font-heading font-semibold group-hover:text-primary">
                {c.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {c._count.products.toLocaleString("en-KE")} product
                {c._count.products === 1 ? "" : "s"}
              </span>
              {c.description && (
                <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {c.description}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No categories yet. Check back soon.
        </p>
      )}
    </div>
  );
}
