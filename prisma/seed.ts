/**
 * SafariCart seed
 * Run with:  pnpm db:seed
 *
 * Idempotent: re-running deletes and re-inserts the seed dataset.
 * Demo accounts (DO NOT use these credentials in production):
 *   admin@safaricart.local              / admin123
 *   customer@safaricart.local           / customer123
 *   vendor-mama@safaricart.local        / vendor123
 *   vendor-nairobi@safaricart.local     / vendor123
 *   vendor-mombasa@safaricart.local     / vendor123
 *   vendor-kakuzi@safaricart.local      / vendor123
 */

import { PrismaClient, type UserRole, type VendorStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD_ROUNDS = 10;

async function hash(pw: string) {
  return bcrypt.hash(pw, PASSWORD_ROUNDS);
}

async function clear() {
  // Order matters because of FK relations
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log("→ Clearing existing data");
  await clear();

  // ─── Users ────────────────────────────────────────────────────────────
  console.log("→ Seeding users");
  const [adminPw, customerPw, vendorPw] = await Promise.all([
    hash("admin123"),
    hash("customer123"),
    hash("vendor123"),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: "admin@safaricart.local",
      name: "SafariCart Admin",
      passwordHash: adminPw,
      role: "ADMIN" satisfies UserRole,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@safaricart.local",
      name: "Wanjiku Mwangi",
      phone: "+254712345678",
      passwordHash: customerPw,
      role: "CUSTOMER",
    },
  });

  const vendorUsers = await Promise.all(
    [
      ["vendor-mama@safaricart.local", "Mama Akinyi"],
      ["vendor-nairobi@safaricart.local", "James Kamau"],
      ["vendor-mombasa@safaricart.local", "Aisha Salim"],
      ["vendor-kakuzi@safaricart.local", "Peter Mutua"],
    ].map(([email, name]) =>
      prisma.user.create({
        data: {
          email: email!,
          name: name!,
          passwordHash: vendorPw,
          role: "VENDOR",
        },
      }),
    ),
  );

  // ─── Vendors ──────────────────────────────────────────────────────────
  console.log("→ Seeding vendors");
  const [mamaUser, nairobiUser, mombasaUser, kakuziUser] = vendorUsers;

  const [mamaVendor, nairobiVendor, mombasaVendor, kakuziVendor] = await Promise.all([
    prisma.vendor.create({
      data: {
        userId: mamaUser!.id,
        slug: "mama-kenya-shop",
        name: "Mama Kenya Shop",
        description:
          "Family-run general goods store serving Nairobi since 2014. M-Pesa friendly, same-day delivery within CBD.",
        contactEmail: "hello@mamakenya.example",
        contactPhone: "+254722000111",
        county: "Nairobi",
        status: "APPROVED" satisfies VendorStatus,
        verifiedAt: new Date(),
        mpesaPaybill: "5236894",
        commissionBps: 1000,
      },
    }),
    prisma.vendor.create({
      data: {
        userId: nairobiUser!.id,
        slug: "nairobi-tech-hub",
        name: "Nairobi Tech Hub",
        description:
          "Authorised electronics dealer — phones, TVs, laptops. 1-year warranty on every device.",
        contactEmail: "sales@nairobitech.example",
        contactPhone: "+254733222111",
        county: "Nairobi",
        status: "APPROVED",
        verifiedAt: new Date(),
        mpesaTillNumber: "789456",
        commissionBps: 800,
      },
    }),
    prisma.vendor.create({
      data: {
        userId: mombasaUser!.id,
        slug: "mombasa-fashion-house",
        name: "Mombasa Fashion House",
        description:
          "Coastal-inspired clothing and accessories. Handcrafted Maasai beadwork, Ankara prints, kanga sets.",
        contactEmail: "shop@mombasafashion.example",
        contactPhone: "+254711555444",
        county: "Mombasa",
        status: "PENDING", // intentionally unverified — shows the un-badged state
        commissionBps: 1200,
      },
    }),
    prisma.vendor.create({
      data: {
        userId: kakuziUser!.id,
        slug: "kakuzi-estate",
        name: "Kakuzi Estate",
        description:
          "Murang'a-grown macadamia, avocado oils, and specialty produce. Direct from farm to door.",
        contactEmail: "online@kakuzi.example",
        contactPhone: "+254700888777",
        county: "Murang'a",
        status: "APPROVED",
        verifiedAt: new Date(),
        bankName: "KCB Bank",
        bankAccountName: "Kakuzi PLC",
        bankAccountNumber: "1100123456",
        commissionBps: 900,
      },
    }),
  ]);

  // ─── Categories ───────────────────────────────────────────────────────
  console.log("→ Seeding categories");
  const categorySpecs = [
    { slug: "electronics", name: "Electronics", sortOrder: 1 },
    { slug: "phones", name: "Phones & Accessories", sortOrder: 2 },
    { slug: "fashion", name: "Fashion", sortOrder: 3 },
    { slug: "home-kitchen", name: "Home & Kitchen", sortOrder: 4 },
    { slug: "beauty-health", name: "Beauty & Health", sortOrder: 5 },
    { slug: "groceries", name: "Groceries", sortOrder: 6 },
  ] as const;

  const categories = Object.fromEntries(
    await Promise.all(
      categorySpecs.map(async (c) => {
        const created = await prisma.category.create({
          data: {
            slug: c.slug,
            name: c.name,
            sortOrder: c.sortOrder,
            isFeatured: true,
            imageUrl: `https://picsum.photos/seed/sc-cat-${c.slug}/600/400`,
          },
        });
        return [c.slug, created] as const;
      }),
    ),
  );

  // ─── Products ─────────────────────────────────────────────────────────
  console.log("→ Seeding products");

  type ProductSeed = {
    slug: string;
    title: string;
    description: string;
    categorySlug: keyof typeof categories;
    vendorId: string;
    priceKes: number;
    compareAtPriceKes?: number;
    stock: number;
    isFeatured?: boolean;
    imageSeed: string;
  };

  const productSeeds: ProductSeed[] = [
    // Electronics / Phones (Nairobi Tech Hub)
    {
      slug: "tecno-spark-30-pro",
      title: "Tecno Spark 30 Pro 256GB",
      description:
        "8GB RAM, 5000mAh battery, 108MP camera. Comes with a 1-year Tecno Kenya warranty.",
      categorySlug: "phones",
      vendorId: nairobiVendor.id,
      priceKes: 25500,
      compareAtPriceKes: 28000,
      stock: 42,
      isFeatured: true,
      imageSeed: "tecno",
    },
    {
      slug: "sony-bravia-55-4k",
      title: 'Sony Bravia 55" 4K Smart TV',
      description:
        "Google TV, HDR10, 4K Dolby Vision, voice remote. Free wall-mount with delivery.",
      categorySlug: "electronics",
      vendorId: nairobiVendor.id,
      priceKes: 75000,
      compareAtPriceKes: 89000,
      stock: 7,
      isFeatured: true,
      imageSeed: "sony",
    },
    {
      slug: "hp-pavilion-15",
      title: "HP Pavilion 15 (Ryzen 5, 16GB, 512GB SSD)",
      description: "Slim 15.6-inch laptop ideal for students and remote work.",
      categorySlug: "electronics",
      vendorId: nairobiVendor.id,
      priceKes: 92000,
      stock: 5,
      imageSeed: "hp-laptop",
    },
    {
      slug: "anker-soundcore-bluetooth",
      title: "Anker Soundcore Bluetooth Speaker",
      description: "24-hour playtime, IPX7 waterproof. Pairs two for stereo sound.",
      categorySlug: "electronics",
      vendorId: nairobiVendor.id,
      priceKes: 4800,
      stock: 30,
      imageSeed: "anker",
    },
    {
      slug: "samsung-a16-128",
      title: "Samsung Galaxy A16 128GB",
      description: "6.7-inch Super AMOLED, dual SIM, 6 years of OS updates.",
      categorySlug: "phones",
      vendorId: nairobiVendor.id,
      priceKes: 21500,
      stock: 18,
      imageSeed: "samsung",
    },
    // Fashion (Mombasa Fashion House)
    {
      slug: "maasai-beaded-sandals",
      title: "Maasai Beaded Leather Sandals",
      description:
        "Hand-stitched in Kajiado. Genuine cowhide with traditional beadwork. Sizes 36–43.",
      categorySlug: "fashion",
      vendorId: mombasaVendor.id,
      priceKes: 1800,
      stock: 60,
      isFeatured: true,
      imageSeed: "sandals",
    },
    {
      slug: "ankara-print-dress",
      title: "Ankara Print Maxi Dress",
      description: "Cotton wax print, hidden side pockets, sizes XS–XL.",
      categorySlug: "fashion",
      vendorId: mombasaVendor.id,
      priceKes: 3500,
      compareAtPriceKes: 4200,
      stock: 25,
      isFeatured: true,
      imageSeed: "ankara",
    },
    {
      slug: "kanga-twin-set",
      title: "Coastal Kanga Twin Set",
      description: "Two-piece kanga with proverb borders. Perfect for the beach.",
      categorySlug: "fashion",
      vendorId: mombasaVendor.id,
      priceKes: 1200,
      stock: 80,
      imageSeed: "kanga",
    },
    {
      slug: "leather-laptop-bag",
      title: "Hand-stitched Leather Laptop Bag",
      description: "Fits up to 15-inch laptops. Shoulder + briefcase straps.",
      categorySlug: "fashion",
      vendorId: mombasaVendor.id,
      priceKes: 5800,
      stock: 12,
      imageSeed: "leather-bag",
    },
    // Beauty & Health / Groceries (Kakuzi Estate)
    {
      slug: "macadamia-oil-500ml",
      title: "Cold-Pressed Macadamia Oil 500ml",
      description: "Single-origin Murang'a macadamia. Cooking-grade, vitamin E rich.",
      categorySlug: "groceries",
      vendorId: kakuziVendor.id,
      priceKes: 1200,
      stock: 100,
      isFeatured: true,
      imageSeed: "oil",
    },
    {
      slug: "avocado-oil-1l",
      title: "Extra Virgin Avocado Oil 1L",
      description: "Cold-pressed Hass avocados. Heart-healthy unsaturated fats.",
      categorySlug: "groceries",
      vendorId: kakuziVendor.id,
      priceKes: 2400,
      stock: 60,
      imageSeed: "avocado",
    },
    {
      slug: "raw-honey-500g",
      title: "Wild Acacia Raw Honey 500g",
      description: "Unpasteurised honey from Baringo. Naturally crystallises.",
      categorySlug: "groceries",
      vendorId: kakuziVendor.id,
      priceKes: 950,
      stock: 75,
      imageSeed: "honey",
    },
    {
      slug: "shea-butter-250g",
      title: "Pure Shea Butter 250g",
      description: "Unrefined shea butter. Great for skin and hair.",
      categorySlug: "beauty-health",
      vendorId: kakuziVendor.id,
      priceKes: 700,
      stock: 200,
      imageSeed: "shea",
    },
    // Home & Kitchen / general (Mama Kenya Shop)
    {
      slug: "solar-lantern",
      title: "Bamburi Rechargeable Solar Lantern",
      description: "12-hour runtime, USB charging, doubles as a power bank.",
      categorySlug: "home-kitchen",
      vendorId: mamaVendor.id,
      priceKes: 2400,
      stock: 50,
      isFeatured: true,
      imageSeed: "lantern",
    },
    {
      slug: "java-house-coffee-250g",
      title: "Java House Roasted Coffee Beans 250g",
      description: "Single-origin Kenyan AA, medium roast. Whole bean.",
      categorySlug: "groceries",
      vendorId: mamaVendor.id,
      priceKes: 850,
      stock: 0, // intentionally out of stock
      isFeatured: true,
      imageSeed: "coffee",
    },
    {
      slug: "probox-storage-50l",
      title: "ProBox Stackable Storage Container 50L",
      description: "Sturdy plastic container with snap-lock lid. Stackable.",
      categorySlug: "home-kitchen",
      vendorId: mamaVendor.id,
      priceKes: 950,
      stock: 120,
      isFeatured: true,
      imageSeed: "probox",
    },
    {
      slug: "kettle-1-7l",
      title: "Ramtons 1.7L Cordless Kettle",
      description: "Stainless steel, auto-shutoff, illuminated water gauge.",
      categorySlug: "home-kitchen",
      vendorId: mamaVendor.id,
      priceKes: 2200,
      stock: 35,
      imageSeed: "kettle",
    },
    {
      slug: "non-stick-cookware-set",
      title: "5-Piece Non-Stick Cookware Set",
      description: "Granite-coated, induction-friendly. Includes spatula and ladle.",
      categorySlug: "home-kitchen",
      vendorId: mamaVendor.id,
      priceKes: 6500,
      compareAtPriceKes: 7800,
      stock: 14,
      imageSeed: "cookware",
    },
  ];

  const products = await Promise.all(
    productSeeds.map((p) =>
      prisma.product.create({
        data: {
          slug: p.slug,
          title: p.title,
          description: p.description,
          categoryId: categories[p.categorySlug].id,
          vendorId: p.vendorId,
          priceKes: p.priceKes,
          compareAtPriceKes: p.compareAtPriceKes ?? null,
          stock: p.stock,
          isPublished: true,
          isFeatured: p.isFeatured ?? false,
          images: [`https://picsum.photos/seed/sc-prod-${p.imageSeed}/600/600`],
        },
      }),
    ),
  );

  // ─── Reviews ──────────────────────────────────────────────────────────
  console.log("→ Seeding reviews");
  // Customer can only review the same product once, so vary which products
  // get reviewed. For richer ratings we'd seed more reviewer accounts —
  // this is enough to render non-zero ratings across the catalog.
  const reviewBodies = [
    { rating: 5, title: "Loved it", body: "Exactly as described. Fast delivery to Westlands." },
    { rating: 4, title: "Good value", body: "Solid quality for the price. Slight delay in shipping but worth it." },
    { rating: 5, title: "Repeat customer", body: "Third time buying. Vendor is reliable, quality consistent." },
  ];
  for (const product of products) {
    // Skip seeding a review on the out-of-stock product (it's empty for a reason)
    if (product.stock === 0) continue;
    const r = reviewBodies[Math.floor(Math.random() * reviewBodies.length)]!;
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: customer.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
      },
    });
  }

  // ─── Address for the demo customer ────────────────────────────────────
  console.log("→ Seeding demo customer address");
  await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      recipientName: "Wanjiku Mwangi",
      recipientPhone: "+254712345678",
      county: "Nairobi",
      subCounty: "Westlands",
      streetAddress: "Apt 4B, Acacia Apartments, Waiyaki Way",
      landmark: "Opposite Westgate Mall",
      isDefault: true,
    },
  });

  console.log("✓ Seed complete");
  console.log(`  ${await prisma.user.count()} users`);
  console.log(`  ${await prisma.vendor.count()} vendors`);
  console.log(`  ${await prisma.category.count()} categories`);
  console.log(`  ${await prisma.product.count()} products`);
  console.log(`  ${await prisma.review.count()} reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
