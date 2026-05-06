import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="px-4 py-6 md:px-6">
        <Link
          href="/"
          aria-label="SafariCart home"
          className="flex w-fit items-center gap-2"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="size-5" />
          </span>
          <span className="font-heading text-xl font-bold tracking-tight">
            SafariCart
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
