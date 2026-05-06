import Link from "next/link";
import { Search, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/server/auth";
import { logoutAction } from "@/server/actions/auth";
import { getCartCount } from "@/server/cart";

const menuLinkClass = "flex w-full px-1.5 py-1";

export async function Header() {
  const [session, cartCount] = await Promise.all([auth(), getCartCount()]);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link
          href="/"
          aria-label="SafariCart home"
          className="flex shrink-0 items-center gap-2"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="size-5" />
          </span>
          <span className="font-heading text-xl font-bold tracking-tight">
            SafariCart
          </span>
        </Link>

        <form
          role="search"
          action="/search"
          className="hidden flex-1 md:block"
        >
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search for products, brands, vendors…"
              className="h-10 w-full pl-9"
            />
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-1 md:gap-2">
          {user?.role !== "VENDOR" && user?.role !== "ADMIN" && (
            <Link
              href="/vendor/register"
              className={`${buttonVariants({ variant: "ghost", size: "sm" })} hidden lg:inline-flex`}
            >
              Sell on SafariCart
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Account menu" />
              }
            >
              <User className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {user.name ?? "Account"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <Link href="/account" className={menuLinkClass}>
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <Link href="/account/orders" className={menuLinkClass}>
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <Link href="/account/addresses" className={menuLinkClass}>
                      Addresses
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "VENDOR" && (
                    <DropdownMenuItem className="p-0">
                      <Link href="/vendor/dashboard" className={menuLinkClass}>
                        Vendor dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem className="p-0">
                      <Link href="/admin" className={menuLinkClass}>
                        Admin panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <form action={logoutAction} className="w-full">
                      <button
                        type="submit"
                        className={`${menuLinkClass} text-left`}
                      >
                        Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="p-0">
                    <Link href="/login" className={menuLinkClass}>
                      Sign in
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <Link href="/register" className={menuLinkClass}>
                      Create an account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <Link href="/vendor/register" className={menuLinkClass}>
                      Become a vendor
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <Link href="/help" className={menuLinkClass}>
                      Help center
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <Link href="/orders/track" className={menuLinkClass}>
                      Track order
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            className={`${buttonVariants({ variant: "ghost", size: "icon" })} relative`}
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-xs"
              >
                {cartCount}
              </Badge>
            )}
          </Link>
        </nav>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-3 md:hidden">
        <form role="search" action="/search">
          <label htmlFor="site-search-mobile" className="sr-only">
            Search products
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="site-search-mobile"
              name="q"
              type="search"
              placeholder="Search SafariCart…"
              className="h-10 w-full pl-9"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
