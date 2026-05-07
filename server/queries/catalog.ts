import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export type CategoryCardData = {
  slug: string;
  name: string;
  imageUrl: string | null;
};

export type ProductCardData = {
  slug: string;
  title: string;
  priceKes: number;
  compareAtPriceKes: number | null;
  image: string | null;
  inStock: boolean;
  vendor: { slug: string; name: string; isVerified: boolean };
  rating: number;
  reviewCount: number;
};

const PRODUCT_CARD_INCLUDE = {
  vendor: { select: { slug: true, name: true, status: true } },
  reviews: { where: { isHidden: false }, select: { rating: true } },
} as const satisfies Prisma.ProductInclude;

// Public catalog visibility rule: a product is browsable only if both the
// product itself is published AND its vendor is approved (i.e. not pending
// review or suspended). Use this everywhere we render to anonymous users so
// the vendor-dashboard banner ("won't appear until approved") is truthful.
const PUBLIC_PRODUCT_FILTER = {
  isPublished: true,
  vendor: { status: "APPROVED" },
} as const satisfies Prisma.ProductWhereInput;

type ProductWithIncludes = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_CARD_INCLUDE;
}>;

function toProductCardData(p: ProductWithIncludes): ProductCardData {
  const ratings = p.reviews.map((r) => r.rating);
  const avg =
    ratings.length === 0
      ? 0
      : ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

  return {
    slug: p.slug,
    title: p.title,
    priceKes: p.priceKes,
    compareAtPriceKes: p.compareAtPriceKes,
    image: p.images[0] ?? null,
    inStock: p.stock > 0,
    vendor: {
      slug: p.vendor.slug,
      name: p.vendor.name,
      isVerified: p.vendor.status === "APPROVED",
    },
    rating: Math.round(avg * 10) / 10,
    reviewCount: ratings.length,
  };
}

export async function getFeaturedCategories(limit = 6): Promise<CategoryCardData[]> {
  return db.category.findMany({
    where: { isFeatured: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: limit,
    select: { slug: true, name: true, imageUrl: true },
  });
}

export async function getAllCategories(): Promise<CategoryCardData[]> {
  return db.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, imageUrl: true },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    select: { slug: true, name: true, description: true, imageUrl: true },
  });
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await db.product.findMany({
    where: { ...PUBLIC_PRODUCT_FILTER, isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: PRODUCT_CARD_INCLUDE,
  });
  return products.map(toProductCardData);
}

export type Pagination = { page: number; perPage: number };

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

function paged<T>(items: T[], total: number, { page, perPage }: Pagination): Paged<T> {
  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getProductsByCategory(
  categorySlug: string,
  pagination: Pagination,
): Promise<Paged<ProductCardData>> {
  const where: Prisma.ProductWhereInput = {
    ...PUBLIC_PRODUCT_FILTER,
    category: { slug: categorySlug },
  };
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      include: PRODUCT_CARD_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage,
    }),
    db.product.count({ where }),
  ]);
  return paged(rows.map(toProductCardData), total, pagination);
}

export type ProductSort =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

export type SearchFilters = {
  q?: string;
  categorySlug?: string;
  minPriceKes?: number;
  maxPriceKes?: number;
  county?: string;
  inStockOnly?: boolean;
  sort?: ProductSort;
};

function orderByForSort(sort: ProductSort): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { priceKes: "asc" };
    case "price-desc":
      return { priceKes: "desc" };
    case "rating":
      // Approximation: by featured then newest. Computing average rating in
      // SQL would need a denormalised column or a raw query; we keep things
      // simple here.
      return { isFeatured: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

export async function searchProducts(
  filters: SearchFilters,
  pagination: Pagination,
): Promise<Paged<ProductCardData>> {
  const term = (filters.q ?? "").trim();

  const where: Prisma.ProductWhereInput = {
    ...PUBLIC_PRODUCT_FILTER,
    ...(term && {
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { vendor: { name: { contains: term, mode: "insensitive" } } },
      ],
    }),
    ...(filters.categorySlug && { category: { slug: filters.categorySlug } }),
    ...((filters.minPriceKes != null || filters.maxPriceKes != null) && {
      priceKes: {
        ...(filters.minPriceKes != null && { gte: filters.minPriceKes }),
        ...(filters.maxPriceKes != null && { lte: filters.maxPriceKes }),
      },
    }),
    // County filter has to merge with the status filter that's already in
    // PUBLIC_PRODUCT_FILTER under `vendor`. Spread carefully so neither wins.
    ...(filters.county && {
      vendor: { status: "APPROVED", county: filters.county },
    }),
    ...(filters.inStockOnly && { stock: { gt: 0 } }),
  };

  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      include: PRODUCT_CARD_INCLUDE,
      orderBy: orderByForSort(filters.sort ?? "newest"),
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage,
    }),
    db.product.count({ where }),
  ]);
  return paged(rows.map(toProductCardData), total, pagination);
}

/** Products with a `compareAtPriceKes` set — i.e., on sale. */
export async function getDealsProducts(
  pagination: Pagination,
): Promise<Paged<ProductCardData>> {
  const where: Prisma.ProductWhereInput = {
    ...PUBLIC_PRODUCT_FILTER,
    // Trust vendor input. Cards re-validate `compareAtPriceKes > priceKes`
    // before rendering the discount badge, so any noise here renders cleanly.
    compareAtPriceKes: { not: null, gt: 0 },
  };
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      include: PRODUCT_CARD_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage,
    }),
    db.product.count({ where }),
  ]);
  return paged(rows.map(toProductCardData), total, pagination);
}

/** Most recently published products. */
export async function getNewArrivals(
  pagination: Pagination,
): Promise<Paged<ProductCardData>> {
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where: PUBLIC_PRODUCT_FILTER,
      include: PRODUCT_CARD_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage,
    }),
    db.product.count({ where: PUBLIC_PRODUCT_FILTER }),
  ]);
  return paged(rows.map(toProductCardData), total, pagination);
}

export async function getCategoryListWithCounts() {
  return db.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      imageUrl: true,
      _count: {
        select: {
          products: { where: PUBLIC_PRODUCT_FILTER },
        },
      },
    },
  });
}

export async function getProductsByVendor(
  vendorSlug: string,
  pagination: Pagination,
): Promise<Paged<ProductCardData>> {
  // Vendor storefront page is only reachable when vendor is APPROVED
  // (the page itself notFound()'s otherwise), so no status filter needed
  // here — keeps drafts hidden but shows all approved-vendor products.
  const where: Prisma.ProductWhereInput = {
    isPublished: true,
    vendor: { slug: vendorSlug, status: "APPROVED" },
  };
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      include: PRODUCT_CARD_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage,
    }),
    db.product.count({ where }),
  ]);
  return paged(rows.map(toProductCardData), total, pagination);
}

export async function getVendorBySlug(slug: string) {
  return db.vendor.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      logoUrl: true,
      coverUrl: true,
      county: true,
      status: true,
      verifiedAt: true,
      createdAt: true,
      _count: { select: { products: { where: { isPublished: true } } } },
    },
  });
}

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getProductBySlug(slug: string) {
  const product = await db.product.findFirst({
    // Hide products from non-approved vendors. findFirst lets us add the
    // vendor.status filter; findUnique doesn't accept relation filters.
    where: {
      slug,
      isPublished: true,
      vendor: { status: "APPROVED" },
    },
    include: {
      vendor: {
        select: {
          slug: true,
          name: true,
          status: true,
          county: true,
          description: true,
        },
      },
      category: { select: { slug: true, name: true } },
      reviews: {
        where: { isHidden: false },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!product) return null;

  const ratings = product.reviews.map((r) => r.rating);
  const avg =
    ratings.length === 0
      ? 0
      : ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

  return {
    ...product,
    rating: Math.round(avg * 10) / 10,
    reviewCount: ratings.length,
    isVendorVerified: product.vendor.status === "APPROVED",
  };
}
