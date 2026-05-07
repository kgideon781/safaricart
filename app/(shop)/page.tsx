import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { publicAppUrl } from "@/server/env";

const description =
  "Shop Kenya's online marketplace. Discover electronics, fashion, home goods and more from trusted vendors across all 47 counties. Pay with M-Pesa or card. Fast delivery nationwide.";

export const metadata: Metadata = {
  title: {
    absolute: "SafariCart — Kenya's online marketplace | Shop with M-Pesa",
  },
  description,
  alternates: { canonical: publicAppUrl().replace(/\/$/, "") || "/" },
  keywords: [
    "online shopping Kenya",
    "Kenya marketplace",
    "M-Pesa shopping",
    "buy online Kenya",
    "Nairobi e-commerce",
    "Kenyan vendors",
  ],
  openGraph: {
    type: "website",
    title: "SafariCart — Kenya's online marketplace",
    description,
    url: publicAppUrl().replace(/\/$/, "") || "/",
    siteName: "SafariCart",
    locale: "en_KE",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCategories />
      <FeaturedProducts />
    </>
  );
}
