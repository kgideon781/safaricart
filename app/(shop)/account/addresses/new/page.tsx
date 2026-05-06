import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AddressForm } from "./address-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KENYAN_COUNTIES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Add address" };

export default function NewAddressPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/account/addresses"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to addresses
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Add a new address</CardTitle>
          <CardDescription>
            We deliver to all 47 counties via courier and post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddressForm counties={[...KENYAN_COUNTIES]} />
        </CardContent>
      </Card>
    </div>
  );
}
