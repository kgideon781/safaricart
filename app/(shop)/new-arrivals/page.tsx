import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getNewArrivals } from "@/server/queries/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/layout/pagination";

const PER_PAGE = 24;

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The newest products added by SafariCart vendors.",
};

export default async function NewArrivalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getNewArrivals({ page, perPage: PER_PAGE });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-secondary/10 text-secondary">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            New arrivals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Freshly listed across all vendors and categories.
          </p>
        </div>
      </div>

      <ProductGrid products={result.items} />

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefForPage={(p) => `/new-arrivals?page=${p}`}
      />
    </div>
  );
}
