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
  reviews: { select: { rating: true } },
} as const satisfies Prisma.ProductInclude;

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
    where: { isPublished: true, isFeatured: true },
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
    isPublished: true,
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

export async function searchProducts(
  q: string,
  pagination: Pagination,
): Promise<Paged<ProductCardData>> {
  const term = q.trim();
  if (!term) return paged([], 0, pagination);

  const where: Prisma.ProductWhereInput = {
    isPublished: true,
    OR: [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { vendor: { name: { contains: term, mode: "insensitive" } } },
    ],
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

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getProductBySlug(slug: string) {
  const product = await db.product.findUnique({
    where: { slug, isPublished: true },
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
