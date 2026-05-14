import "server-only";
import { db } from "@/server/db";
import { publicAppUrl } from "@/server/env";
import { logger } from "@/server/log";
import { formatKES } from "@/lib/kenya";
import { sendMail } from "./transport";
import { emailLayout, buttonHtml, esc } from "./layout";

const log = logger("email.quotes");

function baseUrl(): string {
  return publicAppUrl().replace(/\/$/, "");
}

/** Confirmation to the customer that we received their request. */
export async function sendQuoteAck(opts: {
  to: string;
  name?: string | null;
  title: string;
  quoteId: string;
}): Promise<void> {
  const url = `${baseUrl()}/account/quotes/${opts.quoteId}`;
  const html = emailLayout({
    previewText: `We got your quote request for ${opts.title}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;">Hi ${esc(opts.name ?? "there")},</p>
      <p style="margin:0 0 16px 0;line-height:1.6;">Thanks for sending us a quote request for <strong>${esc(opts.title)}</strong>. Our sourcing team will review it and get back to you, usually within 1–2 business days.</p>
      <p style="margin:0 0 24px 0;">${buttonHtml(url, "View my request")}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">You'll get another email as soon as we have a price for you.</p>
    `,
  });
  await sendMail({
    to: opts.to,
    subject: `Quote request received — ${opts.title}`,
    html,
    purpose: "orders",
  });
}

/** Heads-up to every ADMIN that a new request is in the inbox. */
export async function notifyAdminsNewQuoteRequest(opts: {
  quoteId: string;
  title: string;
  quantity: number;
  targetPriceKes: number | null;
  customerName: string | null;
  customerEmail: string;
}): Promise<void> {
  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  if (admins.length === 0) {
    log.warn("no admins to notify of quote request");
    return;
  }
  const url = `${baseUrl()}/admin/quotes/${opts.quoteId}`;
  const target = opts.targetPriceKes ? formatKES(opts.targetPriceKes) : "—";
  const html = emailLayout({
    previewText: `New quote request: ${opts.title}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;font-weight:600;">New quote request</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;font-size:14px;line-height:1.6;">
        <tr><td style="color:#64748b;padding-right:12px;">Item</td><td><strong>${esc(opts.title)}</strong></td></tr>
        <tr><td style="color:#64748b;padding-right:12px;">Quantity</td><td>${opts.quantity}</td></tr>
        <tr><td style="color:#64748b;padding-right:12px;">Target price</td><td>${esc(target)}</td></tr>
        <tr><td style="color:#64748b;padding-right:12px;">From</td><td>${esc(opts.customerName ?? "(no name)")} &lt;${esc(opts.customerEmail)}&gt;</td></tr>
      </table>
      <p style="margin:0 0 16px 0;">${buttonHtml(url, "Review request")}</p>
    `,
  });
  await Promise.allSettled(
    admins.map((a) =>
      sendMail({
        to: a.email,
        subject: `New quote request: ${opts.title}`,
        html,
        purpose: "support",
      }).catch((err) => log.error("admin email failed", { to: a.email, err: String(err) })),
    ),
  );
}

/** Customer notification — admin has provided a price. */
export async function sendQuoteReadyEmail(opts: {
  to: string;
  name?: string | null;
  quoteId: string;
  title: string;
  priceKes: number;
  leadTime: string | null;
  notes: string | null;
  expiresAt: Date;
}): Promise<void> {
  const url = `${baseUrl()}/account/quotes/${opts.quoteId}`;
  const expires = opts.expiresAt.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const html = emailLayout({
    previewText: `Your quote for ${opts.title}: ${formatKES(opts.priceKes)}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;">Hi ${esc(opts.name ?? "there")},</p>
      <p style="margin:0 0 16px 0;line-height:1.6;">We've sourced <strong>${esc(opts.title)}</strong> and prepared a quote.</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;font-size:14px;line-height:1.6;">
        <tr><td style="color:#64748b;padding-right:12px;">Quoted price</td><td><strong>${esc(formatKES(opts.priceKes))}</strong></td></tr>
        ${opts.leadTime ? `<tr><td style="color:#64748b;padding-right:12px;">Lead time</td><td>${esc(opts.leadTime)}</td></tr>` : ""}
        <tr><td style="color:#64748b;padding-right:12px;">Valid until</td><td>${esc(expires)}</td></tr>
      </table>
      ${opts.notes ? `<p style="margin:0 0 16px 0;color:#475569;line-height:1.6;"><em>Notes:</em> ${esc(opts.notes)}</p>` : ""}
      <p style="margin:0 0 24px 0;">${buttonHtml(url, "Accept or decline")}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">If the quote works for you, accept it and we'll follow up to complete the order.</p>
    `,
  });
  await sendMail({
    to: opts.to,
    subject: `Your SafariCart quote — ${opts.title}`,
    html,
    purpose: "orders",
  });
}

/** Customer notification — admin closed the request (can't source, etc.). */
export async function sendQuoteClosedEmail(opts: {
  to: string;
  name?: string | null;
  quoteId: string;
  title: string;
  reason: string | null;
}): Promise<void> {
  const url = `${baseUrl()}/account/quotes/${opts.quoteId}`;
  const html = emailLayout({
    previewText: `Update on your quote for ${opts.title}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;">Hi ${esc(opts.name ?? "there")},</p>
      <p style="margin:0 0 16px 0;line-height:1.6;">We're sorry — we couldn't move forward with your quote request for <strong>${esc(opts.title)}</strong>.</p>
      ${opts.reason ? `<p style="margin:0 0 16px 0;color:#475569;line-height:1.6;"><em>Reason:</em> ${esc(opts.reason)}</p>` : ""}
      <p style="margin:0 0 24px 0;">${buttonHtml(url, "View details")}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">Feel free to submit a new request if the item changes or if you have a different one in mind.</p>
    `,
  });
  await sendMail({
    to: opts.to,
    subject: `Update on your SafariCart quote — ${opts.title}`,
    html,
    purpose: "support",
  });
}
