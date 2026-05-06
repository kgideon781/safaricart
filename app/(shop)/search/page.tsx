import type { Metadata } from "next";
import { searchProducts } from "@/server/queries/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/layout/pagination";

const PER_PAGE = 24;

type SearchParams = Promise<{ q?: string; page?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search results for "${q}"` : "Search",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await searchProducts(q, { page, perPage: PER_PAGE });

  const trimmed = q.trim();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
        {trimmed ? `Search results for "${trimmed}"` : "Search"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {trimmed
          ? `${result.total.toLocaleString("en-KE")} product${result.total === 1 ? "" : "s"} found`
          : "Type a query in the search bar above."}
      </p>

      <div className="mt-6">
        <ProductGrid products={result.items} />
      </div>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefForPage={(p) => `/search?q=${encodeURIComponent(trimmed)}&page=${p}`}
      />
    </div>
  );
}
