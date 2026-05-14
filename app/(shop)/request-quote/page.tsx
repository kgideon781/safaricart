import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/server/auth";
import { db } from "@/server/db";
import { QuoteRequestForm } from "./quote-form";

export const metadata: Metadata = {
  title: "Request a quote",
  description:
    "Can't find what you need on SafariCart? Tell us what to source — we'll come back with a price.",
};

type SearchParams = Promise<{ q?: string }>;

export default async function RequestQuotePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession("/request-quote");
  const sp = await searchParams;

  // Pre-fill the phone if the user already has one on file.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, name: true },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Request a quote
        </h1>
        <p className="mt-2 text-muted-foreground">
          Looking for something we don&apos;t stock yet? Describe the item below
          and our sourcing team will come back with a price, usually within
          1–2 business days.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Tell us what you need</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteRequestForm
            defaultTitle={sp.q ?? ""}
            defaultPhone={user?.phone ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
