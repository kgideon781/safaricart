import type { MetadataRoute } from "next";
import { publicAppUrl } from "@/server/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicAppUrl().replace(/\/$/, "");
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
