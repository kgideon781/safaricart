import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getProductsByCategory } from "@/server/queries/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/layout/pagination";
import { requestBaseUrl } from "@/server/env";

const PER_PAGE = 24;

type RouteParams = Promise<{ slug: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  const url = `${(await requestBaseUrl()).replace(/\/$/, "")}/category/${category.slug}`;
  const description =
    category.description ?? `Shop ${category.name} on SafariCart — Kenya's online marketplace.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: category.name,
      description,
      url,
      siteName: "SafariCart",
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getProductsByCategory(slug, { page, perPage: PER_PAGE });

  const baseUrl = (await requestBaseUrl()).replace(/\/$/, "");
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${baseUrl}/category/${category.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {category.description}
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {result.total.toLocaleString("en-KE")} product
          {result.total === 1 ? "" : "s"}
        </p>
      </div>

      <ProductGrid products={result.items} />

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefForPage={(p) => `/category/${slug}?page=${p}`}
      />
    </div>
  );
}
