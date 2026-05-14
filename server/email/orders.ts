import "server-only";
import { db } from "@/server/db";
import { publicAppUrl } from "@/server/env";
import { formatKES } from "@/lib/kenya";
import { sendMail } from "./transport";
import { emailLayout, buttonHtml, esc } from "./layout";
import { logger } from "@/server/log";

const log = logger("email.orders");

function lineItemRows(items: { quantity: number; productTitle: string; subtotalKes: number }[]): string {
  return items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;color:#0f172a;">${i.quantity}× ${esc(i.productTitle)}</td>
          <td style="padding:8px 0;text-align:right;color:#0f172a;font-weight:500;">${esc(formatKES(i.subtotalKes))}</td>
        </tr>`,
    )
    .join("");
}

/** Send a confirmation to the customer + a "new order" alert to each vendor. */
export async function sendOrderConfirmationEmails(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { vendor: { include: { user: true } } } },
    },
  });
  if (!order) return;

  const url = publicAppUrl().replace(/\/$/, "");
  const orderLink = `${url}/account/orders/${order.orderNumber}`;

  // Customer email
  if (order.user.email) {
    const html = emailLayout({
      previewText: `Your SafariCart order ${order.orderNumber} is confirmed`,
      bodyHtml: `
        <p style="margin:0 0 12px 0;font-size:16px;">Hi ${esc(order.user.name ?? "there")},</p>
        <p style="margin:0 0 16px 0;line-height:1.6;">Thanks for shopping with SafariCart. Your order <strong>${esc(order.orderNumber)}</strong> is confirmed.</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;">
          ${lineItemRows(order.items)}
          <tr><td colspan="2" style="border-top:1px solid #e5e7eb;"></td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Subtotal</td><td style="padding:6px 0;text-align:right;color:#64748b;">${esc(formatKES(order.subtotalKes))}</td></tr>
          ${order.discountKes > 0 ? `<tr><td style="padding:6px 0;color:#64748b;">Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}</td><td style="padding:6px 0;text-align:right;color:#64748b;">-${esc(formatKES(order.discountKes))}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#64748b;">Shipping</td><td style="padding:6px 0;text-align:right;color:#64748b;">${order.shippingFeeKes === 0 ? "Free" : esc(formatKES(order.shippingFeeKes))}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;font-size:16px;border-top:1px solid #e5e7eb;">Total</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:16px;border-top:1px solid #e5e7eb;">${esc(formatKES(order.totalKes))}</td></tr>
        </table>
        <p style="margin:0 0 8px 0;font-weight:500;">Delivery to:</p>
        <p style="margin:0 0 24px 0;color:#475569;line-height:1.6;">${esc(order.shippingRecipientName)}<br/>${esc(order.shippingStreetAddress)}${order.shippingLandmark ? `, ${esc(order.shippingLandmark)}` : ""}<br/>${esc(order.shippingCounty)} County${order.shippingSubCounty ? ` · ${esc(order.shippingSubCounty)}` : ""}<br/>${esc(order.shippingRecipientPhone)}</p>
        <p style="margin:0 0 24px 0;">${buttonHtml(orderLink, "View order")}</p>
      `,
    });
    try {
      await sendMail({
        to: order.user.email,
        subject: `SafariCart order ${order.orderNumber} confirmed`,
        html,
        purpose: "orders",
      });
    } catch (err) {
      log.error("customer email failed", { orderNumber: order.orderNumber, err: String(err) });
    }
  }

  // Per-vendor "new order" emails
  const byVendor = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const list = byVendor.get(item.vendorId) ?? [];
    list.push(item);
    byVendor.set(item.vendorId, list);
  }

  for (const [, items] of byVendor) {
    const vendor = items[0]?.vendor;
    if (!vendor) continue;
    const to = vendor.contactEmail || vendor.user.email;
    if (!to) continue;
    const subtotal = items.reduce((sum, i) => sum + i.subtotalKes, 0);
    const dashLink = `${url}/vendor/dashboard/orders`;
    const html = emailLayout({
      previewText: `New order from SafariCart — ${order.orderNumber}`,
      bodyHtml: `
        <p style="margin:0 0 12px 0;font-size:16px;">Hi ${esc(vendor.name)},</p>
        <p style="margin:0 0 16px 0;line-height:1.6;">You have a new SafariCart order — <strong>${esc(order.orderNumber)}</strong>. Please prepare the item(s) below for fulfillment.</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;">
          ${lineItemRows(items)}
          <tr><td style="padding:8px 0;font-weight:700;border-top:1px solid #e5e7eb;">Your subtotal</td><td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #e5e7eb;">${esc(formatKES(subtotal))}</td></tr>
        </table>
        <p style="margin:0 0 8px 0;font-weight:500;">Ship to:</p>
        <p style="margin:0 0 24px 0;color:#475569;line-height:1.6;">${esc(order.shippingRecipientName)}<br/>${esc(order.shippingStreetAddress)}${order.shippingLandmark ? `, ${esc(order.shippingLandmark)}` : ""}<br/>${esc(order.shippingCounty)} County${order.shippingSubCounty ? ` · ${esc(order.shippingSubCounty)}` : ""}<br/>${esc(order.shippingRecipientPhone)}</p>
        <p style="margin:0 0 24px 0;">${buttonHtml(dashLink, "Open vendor dashboard")}</p>
      `,
    });
    try {
      await sendMail({
        to,
        subject: `New SafariCart order — ${order.orderNumber}`,
        html,
        purpose: "orders",
      });
    } catch (err) {
      log.error("vendor email failed", { vendorId: vendor.id, err: String(err) });
    }
  }
}
