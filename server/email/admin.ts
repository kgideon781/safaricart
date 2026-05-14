import "server-only";
import { db } from "@/server/db";
import { publicAppUrl } from "@/server/env";
import { logger } from "@/server/log";
import { sendMail } from "./transport";
import { emailLayout, buttonHtml, esc } from "./layout";

const log = logger("admin-notify");

/**
 * Fan out a notification to every ADMIN user. Failures per-recipient are
 * logged but never thrown — admin alerts are best-effort and must not
 * break the user-facing operation that triggered them.
 */
async function notifyAdmins(opts: {
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  if (admins.length === 0) {
    log.warn("notifyAdmins called but no ADMIN users exist");
    return;
  }
  await Promise.allSettled(
    admins.map((a) =>
      sendMail({
        to: a.email,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        purpose: "support",
      }).catch((err) => log.error("admin email failed", { to: a.email, err: String(err) })),
    ),
  );
}

export async function notifyAdminsNewVendor(opts: {
  vendorName: string;
  vendorSlug: string;
  contactEmail: string;
  county: string;
}): Promise<void> {
  const url = publicAppUrl().replace(/\/$/, "");
  const subject = `New vendor pending review: ${opts.vendorName}`;
  const html = emailLayout({
    previewText: subject,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;font-weight:600;">New vendor pending review</p>
      <p style="margin:0 0 16px 0;line-height:1.6;">A new vendor has registered and is awaiting approval.</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;font-size:14px;line-height:1.6;">
        <tr><td style="color:#64748b;padding-right:12px;">Business name</td><td><strong>${esc(opts.vendorName)}</strong></td></tr>
        <tr><td style="color:#64748b;padding-right:12px;">Slug</td><td><code>${esc(opts.vendorSlug)}</code></td></tr>
        <tr><td style="color:#64748b;padding-right:12px;">Contact</td><td>${esc(opts.contactEmail)}</td></tr>
        <tr><td style="color:#64748b;padding-right:12px;">County</td><td>${esc(opts.county)}</td></tr>
      </table>
      <p style="margin:0 0 16px 0;">${buttonHtml(`${url}/admin/vendors`, "Review in admin panel")}</p>
    `,
  });
  await notifyAdmins({ subject, html });
}

export async function notifyAdminsKycUpload(opts: {
  vendorName: string;
  vendorSlug: string;
  docType: string;
}): Promise<void> {
  const url = publicAppUrl().replace(/\/$/, "");
  const subject = `KYC document uploaded: ${opts.vendorName}`;
  const html = emailLayout({
    previewText: subject,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;font-weight:600;">KYC document uploaded</p>
      <p style="margin:0 0 16px 0;line-height:1.6;"><strong>${esc(opts.vendorName)}</strong> uploaded a <strong>${esc(opts.docType)}</strong> document for review.</p>
      <p style="margin:0 0 16px 0;">${buttonHtml(`${url}/admin/vendors`, "Open admin panel")}</p>
    `,
  });
  await notifyAdmins({ subject, html });
}

export async function notifyAdminsFirstVendorOrder(opts: {
  vendorName: string;
  vendorSlug: string;
  orderNumber: string;
  totalKes: number;
}): Promise<void> {
  const url = publicAppUrl().replace(/\/$/, "");
  const subject = `First sale: ${opts.vendorName} (${opts.orderNumber})`;
  const html = emailLayout({
    previewText: subject,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;font-weight:600;">A vendor just made their first sale</p>
      <p style="margin:0 0 16px 0;line-height:1.6;"><strong>${esc(opts.vendorName)}</strong> received their first order — <strong>KES ${opts.totalKes.toLocaleString("en-KE")}</strong> on order <strong>${esc(opts.orderNumber)}</strong>. Worth a quick congratulatory ping for vendor success.</p>
      <p style="margin:0 0 16px 0;">${buttonHtml(`${url}/admin/orders`, "View orders")}</p>
    `,
  });
  await notifyAdmins({ subject, html });
}

export async function notifyAdminsRefundRequest(opts: {
  customerEmail: string;
  orderNumber: string;
  reason: string;
}): Promise<void> {
  const url = publicAppUrl().replace(/\/$/, "");
  const subject = `Refund requested: ${opts.orderNumber}`;
  const html = emailLayout({
    previewText: subject,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;font-weight:600;">Refund request</p>
      <p style="margin:0 0 16px 0;line-height:1.6;"><strong>${esc(opts.customerEmail)}</strong> has requested a refund for <strong>${esc(opts.orderNumber)}</strong>.</p>
      <p style="margin:0 0 16px 0;color:#475569;line-height:1.6;"><em>Reason:</em> ${esc(opts.reason)}</p>
      <p style="margin:0 0 16px 0;">${buttonHtml(`${url}/admin/orders`, "Open admin panel")}</p>
    `,
  });
  await notifyAdmins({ subject, html });
}
