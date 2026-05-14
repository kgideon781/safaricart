import "server-only";
import { publicAppUrl } from "@/server/env";
import { sendMail } from "./transport";
import { emailLayout, buttonHtml, esc } from "./layout";

export async function sendVerificationEmail(opts: {
  to: string;
  name?: string | null;
  token: string;
}): Promise<void> {
  const link = `${publicAppUrl().replace(/\/$/, "")}/verify-email/${opts.token}`;
  const greeting = opts.name ? `Hi ${esc(opts.name)},` : "Hi,";
  const html = emailLayout({
    previewText: "Confirm your SafariCart email address",
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;">${greeting}</p>
      <p style="margin:0 0 16px 0;line-height:1.6;">Welcome to SafariCart. Click the button below to confirm your email so we can secure your account and send order updates.</p>
      <p style="margin:0 0 24px 0;">${buttonHtml(link, "Verify my email")}</p>
      <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">If the button doesn't work, paste this into your browser:</p>
      <p style="margin:0 0 16px 0;font-size:13px;color:#64748b;word-break:break-all;">${esc(link)}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
    `,
  });
  await sendMail({
    to: opts.to,
    subject: "Confirm your SafariCart email",
    html,
    text: `Verify your email: ${link}`,
    purpose: "system",
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name?: string | null;
  token: string;
}): Promise<void> {
  const link = `${publicAppUrl().replace(/\/$/, "")}/reset-password/${opts.token}`;
  const greeting = opts.name ? `Hi ${esc(opts.name)},` : "Hi,";
  const html = emailLayout({
    previewText: "Reset your SafariCart password",
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;">${greeting}</p>
      <p style="margin:0 0 16px 0;line-height:1.6;">We received a request to reset your password. Click below to choose a new one.</p>
      <p style="margin:0 0 24px 0;">${buttonHtml(link, "Reset my password")}</p>
      <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">If the button doesn't work, paste this into your browser:</p>
      <p style="margin:0 0 16px 0;font-size:13px;color:#64748b;word-break:break-all;">${esc(link)}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">This link expires in 1 hour. If you didn't ask for a reset, you can ignore this email — your password won't change.</p>
    `,
  });
  await sendMail({
    to: opts.to,
    subject: "Reset your SafariCart password",
    html,
    text: `Reset your password: ${link}`,
    purpose: "system",
  });
}
