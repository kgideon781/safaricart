"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { sendMail } from "@/server/email/transport";
import { emailLayout, esc } from "@/server/email/layout";
import { logger } from "@/server/log";
import type { FormResult } from "@/server/actions/account";

const log = logger("marketing");

// ─── Contact form ─────────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  topic: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(4000),
});

export async function submitContactAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  // Honeypot — bots fill the hidden `website` field; real users don't.
  // Silently succeed so the bot doesn't probe for a different bypass.
  if ((formData.get("website") ?? "") !== "") {
    return { success: "Thanks — your message is on its way." };
  }

  const ip = await clientIp();
  const limit = await rateLimit({
    key: `contact:${ip}`,
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return { error: "Too many messages from your network. Try again later." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    topic: formData.get("topic") ?? undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });

  const subjectLine = parsed.data.topic
    ? `[Contact · ${parsed.data.topic}] ${parsed.data.subject}`
    : `[Contact] ${parsed.data.subject}`;

  const html = emailLayout({
    previewText: parsed.data.subject,
    bodyHtml: `
      <p style="margin:0 0 8px 0;font-size:16px;font-weight:600;">Contact form submission</p>
      <p style="margin:0 0 16px 0;color:#64748b;">From <strong>${esc(parsed.data.name)}</strong> &lt;${esc(parsed.data.email)}&gt;</p>
      ${parsed.data.topic ? `<p style="margin:0 0 8px 0;"><strong>Topic:</strong> ${esc(parsed.data.topic)}</p>` : ""}
      <p style="margin:0 0 8px 0;"><strong>Subject:</strong> ${esc(parsed.data.subject)}</p>
      <p style="margin:0 0 16px 0;white-space:pre-wrap;line-height:1.6;">${esc(parsed.data.message)}</p>
      <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">Reply to this email and it will go straight to ${esc(parsed.data.email)}.</p>
    `,
  });

  await Promise.allSettled(
    admins.map((a) =>
      sendMail({
        to: a.email,
        subject: subjectLine,
        html,
        replyTo: parsed.data.email,
        purpose: "support",
      }).catch((err) =>
        log.error("contact mail failed", { to: a.email, err: String(err) }),
      ),
    ),
  );

  return { success: "Thanks — your message is on its way. We'll reply soon." };
}

// ─── Newsletter ───────────────────────────────────────────────────────────

const newsletterSchema = z.object({
  email: z.string().email(),
});

export async function subscribeNewsletterAction(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const ip = await clientIp();
  const limit = await rateLimit({
    key: `newsletter:${ip}`,
    max: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return { error: "Too many subscribe attempts. Try again later." };
  }

  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Resubscribe is a no-op (idempotent). Clears any prior unsubscribedAt.
  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    create: {
      email: parsed.data.email.toLowerCase(),
      source: "footer",
    },
    update: { unsubscribedAt: null },
  });

  return { success: "Subscribed — watch your inbox." };
}
