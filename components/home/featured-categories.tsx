import Link from "next/link";
import Image from "next/image";
import { featuredCategories } from "@/lib/mock";

export function FeaturedCategories() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Shop by category
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse the most-loved aisles on SafariCart.
          </p>
        </div>
        <Link
          href="/categories"
          className="hidden text-sm font-medium text-primary hover:underline md:inline"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {featuredCategories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-3 text-center">
              <span className="text-sm font-medium group-hover:text-primary">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
