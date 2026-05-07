"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/server/db";
import { signIn, signOut } from "@/server/auth";
import { issueToken, consumeToken } from "@/server/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/server/email/auth";
import { rateLimit, clientIp } from "@/server/rate-limit";
import { logger } from "@/server/log";

const log = logger("auth");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const emailOnlySchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export type AuthFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "token", string[]>>;
} | null;

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  const limit = await rateLimit({
    key: `register:ip:${ip}`,
    max: 5,
    windowMs: 60 * 60 * 1000, // 5 registrations per hour per IP
  });
  if (!limit.ok) return { error: "Too many sign-up attempts. Try again later." };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: ["An account with this email already exists"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await db.user.create({
    data: { name: parsed.data.name, email, passwordHash },
  });

  // Send a verification email. We do not gate sign-in on verification — the
  // user can shop immediately, but we'll show a banner until they verify.
  try {
    const token = await issueToken(email, "EMAIL_VERIFICATION");
    await sendVerificationEmail({ to: email, name: user.name, token });
  } catch (err) {
    log.error("verification email failed", { email, err: String(err) });
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Please log in." };
    }
    throw error; // NEXT_REDIRECT must propagate
  }
  return null;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  const emailRaw = String(formData.get("email") ?? "").toLowerCase();
  // Per-IP and per-email so a single attacker IP can't grind, and a victim
  // email can't be locked out by a bunch of IPs trying random emails.
  const ipLimit = await rateLimit({
    key: `login:ip:${ip}`,
    max: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipLimit.ok) return { error: "Too many sign-in attempts. Try again in a few minutes." };
  const emailLimit = await rateLimit({
    key: `login:email:${emailRaw}`,
    max: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!emailLimit.ok) return { error: "Too many sign-in attempts. Try again in a few minutes." };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "Invalid email or password"
            : "Sign-in failed. Please try again.",
      };
    }
    throw error;
  }
  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function googleLoginAction() {
  await signIn("google", { redirectTo: "/" });
}

export async function facebookLoginAction() {
  await signIn("facebook", { redirectTo: "/" });
}

export async function githubLoginAction() {
  await signIn("github", { redirectTo: "/" });
}

export async function redirectToHome() {
  redirect("/");
}

/* ─── Email verification ───────────────────────────────────────── */

export async function resendVerificationAction(): Promise<AuthFormState> {
  // Pulled from the active session for safety — only the signed-in user can
  // request a re-send for their own email.
  const { auth } = await import("@/server/auth");
  const session = await auth();
  if (!session?.user?.email || !session.user.id) return { error: "Sign in first." };
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Account not found." };
  if (user.emailVerified) return { success: "Your email is already verified." };

  const ip = await clientIp();
  const limit = await rateLimit({
    key: `verify-resend:user:${user.id}:${ip}`,
    max: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) return { error: "You're sending these too fast — try again later." };

  try {
    const token = await issueToken(user.email, "EMAIL_VERIFICATION");
    await sendVerificationEmail({ to: user.email, name: user.name, token });
    return { success: "Verification email sent — check your inbox." };
  } catch (err) {
    log.error("verification resend failed", { email: user.email, err: String(err) });
    return { error: "Could not send the email. Please try again." };
  }
}

export async function verifyEmailAction(token: string): Promise<{ ok: boolean; reason?: string }> {
  const email = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!email) return { ok: false, reason: "This verification link is invalid or has expired." };
  await db.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });
  return { ok: true };
}

/* ─── Password reset ───────────────────────────────────────────── */

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();
  // Cap per IP and per email — both must pass.
  const ipLimit = await rateLimit({
    key: `reset:ip:${ip}`,
    max: 10,
    windowMs: 60 * 60 * 1000,
  });
  const emailLimit = await rateLimit({
    key: `reset:email:${email}`,
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok || !emailLimit.ok) {
    return { error: "Too many password reset requests. Try again later." };
  }

  const user = await db.user.findUnique({ where: { email } });
  // Security: don't reveal whether the email is registered. Always show success.
  if (user && user.passwordHash) {
    try {
      const token = await issueToken(email, "PASSWORD_RESET");
      await sendPasswordResetEmail({ to: email, name: user.name, token });
    } catch (err) {
      log.error("reset email failed", { email, err: String(err) });
    }
  }
  return {
    success: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function completePasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const email = await consumeToken(parsed.data.token, "PASSWORD_RESET");
  if (!email) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.user.update({
    where: { email },
    data: { passwordHash },
  });
  return { success: "Your password has been reset. Sign in with your new password." };
}
