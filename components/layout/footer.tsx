import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const columns = [
  {
    heading: "Shop",
    links: [
      { href: "/categories", label: "All categories" },
      { href: "/deals", label: "Today's deals" },
      { href: "/new-arrivals", label: "New arrivals" },
      { href: "/gift-cards", label: "Gift cards" },
    ],
  },
  {
    heading: "Sell",
    links: [
      { href: "/vendor/register", label: "Become a vendor" },
      { href: "/vendor/learn", label: "Vendor handbook" },
      { href: "/vendor/fees", label: "Fees & commission" },
      { href: "/vendor/login", label: "Vendor sign-in" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/help", label: "Help center" },
      { href: "/orders/track", label: "Track an order" },
      { href: "/legal/returns", label: "Returns & refunds" },
      { href: "/help/shipping", label: "Shipping & delivery" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About SafariCart" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-card text-card-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <ShoppingBag className="size-5" />
              </span>
              <span className="font-heading text-xl font-bold tracking-tight">
                SafariCart
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Kenya's online marketplace. Shop from trusted vendors across all
              47 counties — <span className="italic">safari yako ya ununuzi</span>.
            </p>

            <form className="mt-6 flex max-w-sm gap-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <Input
                id="newsletter-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="h-10"
              />
              <Button type="submit" className="h-10 shrink-0">
                Subscribe
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              Get weekly deals and new-vendor highlights. Unsubscribe anytime.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">
                {col.heading}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="font-medium text-foreground">We accept</span>
            <span>M-Pesa</span>
            <span>·</span>
            <span>Airtel Money</span>
            <span>·</span>
            <span>Visa</span>
            <span>·</span>
            <span>Mastercard</span>
            <span>·</span>
            <span>Cash on delivery</span>
          </div>
          <div className="text-muted-foreground">
            {/* TODO: replace with real registration details once SafariCart Ltd is registered. */}
            <span>SafariCart Ltd · Nairobi, Kenya · Reg. No. PVT-XXXXXXX</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {year} SafariCart. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/legal/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/legal/cookies" className="hover:text-foreground">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
