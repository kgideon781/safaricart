import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, MapPin } from "lucide-react";
import { getVendorBySlug, getProductsByVendor } from "@/server/queries/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/layout/pagination";
import { publicAppUrl } from "@/server/env";

const PER_PAGE = 24;

type RouteParams = Promise<{ slug: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor || vendor.status !== "APPROVED") {
    return { title: "Vendor not found" };
  }
  const description =
    vendor.description?.slice(0, 200) ??
    `Shop ${vendor.name}'s products on SafariCart — Kenya's online marketplace.`;
  const url = `${publicAppUrl().replace(/\/$/, "")}/vendor/${vendor.slug}`;
  return {
    title: vendor.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: vendor.name,
      description,
      url,
      siteName: "SafariCart",
      images: vendor.coverUrl
        ? [{ url: vendor.coverUrl, alt: vendor.name }]
        : vendor.logoUrl
          ? [{ url: vendor.logoUrl, alt: vendor.name }]
          : undefined,
    },
  };
}

export default async function VendorPublicPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const vendor = await getVendorBySlug(slug);
  if (!vendor || vendor.status !== "APPROVED") notFound();

  const products = await getProductsByVendor(slug, { page, perPage: PER_PAGE });

  const baseUrl = publicAppUrl().replace(/\/$/, "");
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: vendor.name,
        item: `${baseUrl}/vendor/${vendor.slug}`,
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {vendor.coverUrl ? (
        <div className="relative h-44 w-full overflow-hidden bg-muted md:h-64">
          <Image
            src={vendor.coverUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ) : (
        <div className="h-20 bg-gradient-to-br from-primary/10 to-secondary/10" />
      )}

      <div className="mx-auto -mt-10 w-full max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-5 md:flex-row md:items-center">
          {vendor.logoUrl ? (
            <Image
              src={vendor.logoUrl}
              alt={vendor.name}
              width={96}
              height={96}
              className="size-20 rounded-lg border border-border bg-background object-cover md:size-24"
            />
          ) : (
            <div className="grid size-20 place-items-center rounded-lg bg-primary/10 text-2xl font-bold text-primary md:size-24">
              {vendor.name[0]}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold md:text-3xl">
                {vendor.name}
              </h1>
              {vendor.verifiedAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                  <BadgeCheck className="size-3.5" /> Verified
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> {vendor.county}
              </span>
              <span>·</span>
              <span>
                {vendor._count.products.toLocaleString("en-KE")} product
                {vendor._count.products === 1 ? "" : "s"}
              </span>
              <span>·</span>
              <span>
                Joined{" "}
                {vendor.createdAt.toLocaleDateString("en-KE", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {vendor.description && (
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                {vendor.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-7xl px-4 pb-12 md:px-6">
        <h2 className="font-heading text-xl font-semibold">All products</h2>
        <div className="mt-4">
          <ProductGrid products={products.items} />
        </div>
        <Pagination
          page={products.page}
          totalPages={products.totalPages}
          hrefForPage={(p) => `/vendor/${slug}?page=${p}`}
        />
      </div>
    </div>
  );
}
