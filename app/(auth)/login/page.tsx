import Link from "next/link";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { env } from "@/server/env";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SearchParams = Promise<{ registered?: string; callbackUrl?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const params = await searchParams;
  const justRegistered = params.registered === "1";
  const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
        <CardDescription>
          {justRegistered
            ? "Account created. Sign in to continue."
            : "Sign in to your SafariCart account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm googleEnabled={googleEnabled} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
