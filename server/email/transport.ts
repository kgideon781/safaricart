import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { logger } from "@/server/log";
import { getSmtpConfig } from "@/server/integrations";

const log = logger("email");

/**
 * Build a transporter for the active SMTP config (DB-first, env-fallback).
 * We rebuild on each send so an admin credential change takes effect on
 * the next email. nodemailer transport construction is cheap.
 */
async function makeTransport(): Promise<{
  transport: Transporter;
  from: string;
  configured: boolean;
}> {
  const { config } = await getSmtpConfig();
  if (!config.host || !config.user || !config.pass) {
    // No SMTP configured — return a JSON transport that just logs to console.
    log.warn("SMTP not configured — using JSON transport (logs only)");
    return {
      transport: nodemailer.createTransport({ jsonTransport: true }),
      from: config.from,
      configured: false,
    };
  }
  return {
    transport: nodemailer.createTransport({
      host: config.host,
      port: config.port ?? 587,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    }),
    from: config.from,
    configured: true,
  };
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<void> {
  const { transport, from } = await makeTransport();
  try {
    const info = await transport.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo,
    });
    log.info("mail sent", { to: opts.to, subject: opts.subject, messageId: info.messageId });
  } catch (err) {
    log.error("mail failed", { to: opts.to, subject: opts.subject, err: String(err) });
    throw err;
  }
}

/** Used by /admin/integrations to validate SMTP credentials. */
export async function testSmtpConnection(opts: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const transport = nodemailer.createTransport({
    host: opts.host,
    port: opts.port,
    secure: opts.secure,
    auth: { user: opts.user, pass: opts.pass },
  });
  try {
    await transport.verify();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "SMTP rejected the credentials",
    };
  }
}
