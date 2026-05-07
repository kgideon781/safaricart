import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { publicAppUrl } from "@/server/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = publicAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "SafariCart — Shop the journey",
    template: "%s — SafariCart",
  },
  description:
    "Kenya's online marketplace. Discover products from trusted vendors across all 47 counties. Safari yako ya ununuzi.",
  openGraph: {
    type: "website",
    siteName: "SafariCart",
    locale: "en_KE",
    url: baseUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

// Organization + WebSite JSON-LD: lets Google show brand panel and a sitelinks
// search box on SERPs. Emitted once on every page via the root layout.
const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SafariCart",
  url: baseUrl,
  logo: `${baseUrl.replace(/\/$/, "")}/icon`,
  sameAs: [] as string[],
  address: {
    "@type": "PostalAddress",
    addressCountry: "KE",
  },
};

const siteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SafariCart",
  url: baseUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${baseUrl.replace(/\/$/, "")}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
        />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
