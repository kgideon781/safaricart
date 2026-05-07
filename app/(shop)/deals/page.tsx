import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { getDealsProducts } from "@/server/queries/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/layout/pagination";

const PER_PAGE = 24;

export const metadata: Metadata = {
  title: "Today's deals",
  description: "Discounted products from SafariCart vendors — the biggest savings, refreshed daily.",
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getDealsProducts({ page, perPage: PER_PAGE });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
          <Tag className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Today&apos;s deals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.total.toLocaleString("en-KE")} item
            {result.total === 1 ? "" : "s"} on sale right now.
          </p>
        </div>
      </div>

      <ProductGrid products={result.items} />

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefForPage={(p) => `/deals?page=${p}`}
      />
    </div>
  );
}
