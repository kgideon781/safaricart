import type { Metadata } from "next";
import { searchProducts, type ProductSort } from "@/server/queries/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/layout/pagination";
import { KENYAN_COUNTIES } from "@/lib/kenya";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PER_PAGE = 24;

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Featured" },
];

type SearchParams = Promise<{
  q?: string;
  page?: string;
  min?: string;
  max?: string;
  county?: string;
  inStock?: string;
  sort?: ProductSort;
}>;

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
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const trimmed = (sp.q ?? "").trim();
  const min = sp.min ? Number(sp.min) : undefined;
  const max = sp.max ? Number(sp.max) : undefined;
  const sort = (sp.sort ?? "newest") as ProductSort;

  const result = await searchProducts(
    {
      q: trimmed,
      minPriceKes: Number.isFinite(min) ? min : undefined,
      maxPriceKes: Number.isFinite(max) ? max : undefined,
      county: sp.county || undefined,
      inStockOnly: sp.inStock === "1",
      sort,
    },
    { page, perPage: PER_PAGE },
  );

  const buildHref = (overrides: Partial<Record<string, string>>) => {
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (sp.min) params.set("min", sp.min);
    if (sp.max) params.set("max", sp.max);
    if (sp.county) params.set("county", sp.county);
    if (sp.inStock) params.set("inStock", sp.inStock);
    if (sp.sort) params.set("sort", sp.sort);
    for (const [k, v] of Object.entries(overrides)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    }
    return `/search?${params.toString()}`;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="break-words font-heading text-3xl font-bold tracking-tight md:text-4xl">
        {trimmed ? `Search results for "${trimmed}"` : "Search"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {result.total.toLocaleString("en-KE")} product
        {result.total === 1 ? "" : "s"} found
      </p>

      <form
        method="get"
        className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_auto_auto_auto_auto_auto] md:items-end"
      >
        <input type="hidden" name="q" value={trimmed} />
        <input type="hidden" name="sort" value={sort} />
        <div className="grid gap-1">
          <label className="text-xs font-medium text-muted-foreground">Min price (KES)</label>
          <Input
            name="min"
            type="number"
            min={0}
            defaultValue={sp.min ?? ""}
            placeholder="0"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-muted-foreground">Max price (KES)</label>
          <Input
            name="max"
            type="number"
            min={0}
            defaultValue={sp.max ?? ""}
            placeholder="100000"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-muted-foreground">County</label>
          <select
            name="county"
            defaultValue={sp.county ?? ""}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All counties</option>
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <label className="mb-1 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="inStock"
            value="1"
            defaultChecked={sp.inStock === "1"}
            className="size-4 rounded border-input"
          />
          In stock only
        </label>
        <Button type="submit" size="sm" className="md:h-9">
          Apply
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Sort:</span>
        {SORTS.map((s) => (
          <a
            key={s.value}
            href={buildHref({ sort: s.value, page: "1" })}
            className={`rounded-full border px-2.5 py-1 ${
              sort === s.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>

      <div className="mt-6">
        <ProductGrid products={result.items} />
      </div>

      {result.total === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-heading text-lg font-semibold">
            Can't find what you're looking for?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us what you need and our sourcing team will come back with a
            quote — usually within 1–2 business days.
          </p>
          <a
            href={`/request-quote${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ""}`}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Request a quote
          </a>
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefForPage={(p) => buildHref({ page: String(p) })}
      />
    </div>
  );
}
