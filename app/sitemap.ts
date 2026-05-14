import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { requestBaseUrl } from "@/server/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (await requestBaseUrl()).replace(/\/$/, "");

  const [products, categories, vendors] = await Promise.all([
    db.product.findMany({
      where: { isPublished: true, vendor: { status: "APPROVED" } },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    db.category.findMany({
      select: { slug: true, updatedAt: true },
    }),
    db.vendor.findMany({
      where: { status: "APPROVED" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/cookies`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/returns`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const vendorEntries: MetadataRoute.Sitemap = vendors.map((v) => ({
    url: `${base}/vendor/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...categoryEntries, ...vendorEntries, ...productEntries];
}
