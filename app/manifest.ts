import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SafariCart — Kenya's online marketplace",
    short_name: "SafariCart",
    description:
      "Shop Kenya's online marketplace. Trusted vendors across all 47 counties. Pay with M-Pesa.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF9",
    theme_color: "#EA580C",
    lang: "en-KE",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
