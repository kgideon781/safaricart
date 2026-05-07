import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-heading text-5xl font-bold tracking-tight">404</h1>
      <p className="mt-3 text-muted-foreground">
        We couldn&apos;t find that page. It may have moved, or the link might
        be wrong.
      </p>
      <Link href="/" className={`${buttonVariants()} mt-6`}>
        Back to SafariCart
      </Link>
    </div>
  );
}
