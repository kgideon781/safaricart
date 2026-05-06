import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Star, Trash2 } from "lucide-react";
import { getAllCategories } from "@/server/queries/admin";
import { deleteCategoryAction } from "@/server/actions/admin";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin · Categories" };

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">Categories</h2>
          <p className="text-sm text-muted-foreground">
            {categories.length.toLocaleString("en-KE")} total
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="size-4" />
          New category
        </Link>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.name}</span>
                {c.isFeatured && (
                  <Badge className="bg-accent text-accent-foreground">
                    <Star className="size-3" />
                    Featured
                  </Badge>
                )}
                {c.parent && (
                  <span className="text-xs text-muted-foreground">
                    under {c.parent.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                /{c.slug} · {c._count.products} product
                {c._count.products === 1 ? "" : "s"}
              </p>
            </div>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={c.id} />
              <button
                type="submit"
                aria-label="Delete"
                title={c._count.products > 0 ? "Cannot delete — has products" : "Delete"}
                disabled={c._count.products > 0}
                className={`${buttonVariants({ variant: "ghost", size: "icon-sm" })} disabled:opacity-30`}
              >
                <Trash2 className="size-4" />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
