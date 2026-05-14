import type { MetadataRoute } from "next";
import { requestBaseUrl } from "@/server/env";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = (await requestBaseUrl()).replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/checkout",
          "/checkout/",
          "/api",
          "/api/",
          "/vendor/dashboard",
          "/vendor/dashboard/",
          "/verify-email/",
          "/reset-password/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
