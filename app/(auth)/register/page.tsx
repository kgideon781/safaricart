import Link from "next/link";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";
import { env } from "@/server/env";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Create your account</CardTitle>
        <CardDescription>
          Start your shopping journey on SafariCart.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm googleEnabled={googleEnabled} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="/legal/terms" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
