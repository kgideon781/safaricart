import "server-only";
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

export async function getFeaturedCategories(limit = 6): Promise<CategoryCardData[]> {
  return db.category.findMany({
    where: { isFeatured: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: limit,
    select: { slug: true, name: true, imageUrl: true },
  });
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await db.product.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      vendor: { select: { slug: true, name: true, status: true } },
      reviews: { select: { rating: true } },
    },
  });

  return products.map(toProductCardData);
}

export function toProductCardData(p: {
  slug: string;
  title: string;
  priceKes: number;
  compareAtPriceKes: number | null;
  stock: number;
  images: string[];
  vendor: { slug: string; name: string; status: string };
  reviews: { rating: number }[];
}): ProductCardData {
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
