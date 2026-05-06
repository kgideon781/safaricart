import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { CategoryForm } from "./category-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin · New category" };

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/categories"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to categories
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">New category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}
