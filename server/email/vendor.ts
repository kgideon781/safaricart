import "server-only";
import { publicAppUrl } from "@/server/env";
import { sendMail } from "./transport";
import { emailLayout, buttonHtml, esc } from "./layout";

export async function sendVendorStatusEmail(opts: {
  to: string;
  vendorName: string;
  status: "APPROVED" | "SUSPENDED";
  notes?: string;
}): Promise<void> {
  const url = publicAppUrl().replace(/\/$/, "");
  const dashLink = `${url}/vendor/dashboard`;
  const subject =
    opts.status === "APPROVED"
      ? "Your SafariCart vendor account is approved"
      : "Your SafariCart vendor account has been suspended";
  const message =
    opts.status === "APPROVED"
      ? `Your store <strong>${esc(opts.vendorName)}</strong> is approved and live on SafariCart. You can now publish products and start receiving orders.`
      : `Your store <strong>${esc(opts.vendorName)}</strong> has been temporarily suspended. Please review the notes below and reach out to support if you have questions.`;
  const html = emailLayout({
    previewText: subject,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;">Hi ${esc(opts.vendorName)},</p>
      <p style="margin:0 0 16px 0;line-height:1.6;">${message}</p>
      ${opts.notes ? `<p style="margin:0 0 16px 0;color:#475569;line-height:1.6;"><em>Reviewer notes:</em> ${esc(opts.notes)}</p>` : ""}
      <p style="margin:0 0 24px 0;">${buttonHtml(dashLink, "Open vendor dashboard")}</p>
    `,
  });
  await sendMail({ to: opts.to, subject, html });
}

export async function sendRefundEmail(opts: {
  to: string;
  name?: string | null;
  orderNumber: string;
  amountKes: number;
  reason?: string;
}): Promise<void> {
  const html = emailLayout({
    previewText: `Refund issued for order ${opts.orderNumber}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;font-size:16px;">Hi ${esc(opts.name ?? "there")},</p>
      <p style="margin:0 0 16px 0;line-height:1.6;">We have issued a refund of <strong>KES ${opts.amountKes.toLocaleString("en-KE")}</strong> for your SafariCart order <strong>${esc(opts.orderNumber)}</strong>. Depending on your payment method, the refund may take 1–7 business days to reach you.</p>
      ${opts.reason ? `<p style="margin:0 0 16px 0;color:#475569;line-height:1.6;"><em>Reason:</em> ${esc(opts.reason)}</p>` : ""}
      <p style="margin:0;font-size:13px;color:#64748b;">If you have any questions, simply reply to this email.</p>
    `,
  });
  await sendMail({
    to: opts.to,
    subject: `Refund issued for order ${opts.orderNumber}`,
    html,
  });
}
