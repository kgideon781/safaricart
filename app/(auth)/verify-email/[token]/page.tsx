import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { verifyEmailAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Verify your email" };

type RouteParams = Promise<{ token: string }>;

export default async function VerifyEmailPage({ params }: { params: RouteParams }) {
  const { token } = await params;
  const result = await verifyEmailAction(token);

  if (!result.ok) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <div className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="size-7" />
          </div>
          <CardTitle className="font-heading text-2xl">Link invalid</CardTitle>
          <CardDescription>{result.reason}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link
            href="/account"
            className={buttonVariants({ variant: "default" })}
          >
            Open my account
          </Link>
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="grid size-14 place-items-center rounded-full bg-secondary/10 text-secondary">
          <CheckCircle2 className="size-7" />
        </div>
        <CardTitle className="font-heading text-2xl">Email verified</CardTitle>
        <CardDescription>Thanks for confirming your address.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/" className={buttonVariants({ variant: "default", className: "w-full" })}>
          Continue shopping
        </Link>
      </CardContent>
    </Card>
  );
}
