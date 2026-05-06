/**
 * Mock data for the homepage shell.
 * Replace with Prisma queries once the catalog has real data.
 *
 * Image URLs use picsum.photos with stable seeds so they don't change per reload.
 */

export type MockCategory = {
  slug: string;
  name: string;
  imageUrl: string;
};

export type MockVendor = {
  slug: string;
  name: string;
  isVerified: boolean;
};

export type MockProduct = {
  slug: string;
  title: string;
  priceKes: number;
  compareAtPriceKes: number | null;
  rating: number; // 0–5
  reviewCount: number;
  imageUrl: string;
  vendor: MockVendor;
  inStock: boolean;
};

export const featuredCategories: MockCategory[] = [
  {
    slug: "electronics",
    name: "Electronics",
    imageUrl: "https://picsum.photos/seed/sc-cat-electronics/600/400",
  },
  {
    slug: "fashion",
    name: "Fashion",
    imageUrl: "https://picsum.photos/seed/sc-cat-fashion/600/400",
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    imageUrl: "https://picsum.photos/seed/sc-cat-home/600/400",
  },
  {
    slug: "beauty-health",
    name: "Beauty & Health",
    imageUrl: "https://picsum.photos/seed/sc-cat-beauty/600/400",
  },
  {
    slug: "phones",
    name: "Phones & Accessories",
    imageUrl: "https://picsum.photos/seed/sc-cat-phones/600/400",
  },
  {
    slug: "groceries",
    name: "Groceries",
    imageUrl: "https://picsum.photos/seed/sc-cat-groceries/600/400",
  },
];

const mamaKenya: MockVendor = { slug: "mama-kenya-shop", name: "Mama Kenya Shop", isVerified: true };
const nairobiTech: MockVendor = { slug: "nairobi-tech-hub", name: "Nairobi Tech Hub", isVerified: true };
const mombasaFashion: MockVendor = { slug: "mombasa-fashion-house", name: "Mombasa Fashion House", isVerified: false };
const kakuzi: MockVendor = { slug: "kakuzi-estate", name: "Kakuzi Estate", isVerified: true };

export const featuredProducts: MockProduct[] = [
  {
    slug: "tecno-spark-30-pro",
    title: "Tecno Spark 30 Pro 256GB",
    priceKes: 25500,
    compareAtPriceKes: 28000,
    rating: 4.4,
    reviewCount: 187,
    imageUrl: "https://picsum.photos/seed/sc-prod-tecno/600/600",
    vendor: nairobiTech,
    inStock: true,
  },
  {
    slug: "sony-bravia-55-4k",
    title: 'Sony Bravia 55" 4K Smart TV',
    priceKes: 75000,
    compareAtPriceKes: 89000,
    rating: 4.7,
    reviewCount: 92,
    imageUrl: "https://picsum.photos/seed/sc-prod-sony/600/600",
    vendor: nairobiTech,
    inStock: true,
  },
  {
    slug: "maasai-beaded-sandals",
    title: "Maasai Beaded Leather Sandals",
    priceKes: 1800,
    compareAtPriceKes: null,
    rating: 4.8,
    reviewCount: 312,
    imageUrl: "https://picsum.photos/seed/sc-prod-sandals/600/600",
    vendor: mombasaFashion,
    inStock: true,
  },
  {
    slug: "macadamia-oil-500ml",
    title: "Cold-Pressed Macadamia Oil 500ml",
    priceKes: 1200,
    compareAtPriceKes: null,
    rating: 4.6,
    reviewCount: 64,
    imageUrl: "https://picsum.photos/seed/sc-prod-oil/600/600",
    vendor: kakuzi,
    inStock: true,
  },
  {
    slug: "ankara-print-dress",
    title: "Ankara Print Maxi Dress",
    priceKes: 3500,
    compareAtPriceKes: 4200,
    rating: 4.5,
    reviewCount: 148,
    imageUrl: "https://picsum.photos/seed/sc-prod-ankara/600/600",
    vendor: mombasaFashion,
    inStock: true,
  },
  {
    slug: "solar-lantern",
    title: "Bamburi Rechargeable Solar Lantern",
    priceKes: 2400,
    compareAtPriceKes: null,
    rating: 4.3,
    reviewCount: 78,
    imageUrl: "https://picsum.photos/seed/sc-prod-lantern/600/600",
    vendor: mamaKenya,
    inStock: true,
  },
  {
    slug: "java-house-coffee-250g",
    title: "Java House Roasted Coffee Beans 250g",
    priceKes: 850,
    compareAtPriceKes: null,
    rating: 4.9,
    reviewCount: 421,
    imageUrl: "https://picsum.photos/seed/sc-prod-coffee/600/600",
    vendor: mamaKenya,
    inStock: false,
  },
  {
    slug: "probox-storage-50l",
    title: "ProBox Stackable Storage Container 50L",
    priceKes: 950,
    compareAtPriceKes: null,
    rating: 4.2,
    reviewCount: 53,
    imageUrl: "https://picsum.photos/seed/sc-prod-probox/600/600",
    vendor: mamaKenya,
    inStock: true,
  },
];
