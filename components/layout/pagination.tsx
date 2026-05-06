import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Builds the href for a given page number. */
  hrefForPage: (page: number) => string;
};

export function Pagination({ page, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-3"
    >
      {prev !== null ? (
        <Link
          href={hrefForPage(prev)}
          rel="prev"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Link>
      ) : (
        <span
          className={`${buttonVariants({ variant: "outline", size: "sm" })} cursor-not-allowed opacity-50`}
        >
          <ChevronLeft className="size-4" />
          Previous
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </span>

      {next !== null ? (
        <Link
          href={hrefForPage(next)}
          rel="next"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Next
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          className={`${buttonVariants({ variant: "outline", size: "sm" })} cursor-not-allowed opacity-50`}
        >
          Next
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
