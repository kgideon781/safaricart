import "server-only";
import { publicAppUrl } from "@/server/env";

/** Tiny HTML escape for substituted strings. */
export function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailLayout(opts: { previewText?: string; bodyHtml: string }): string {
  const url = publicAppUrl();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>SafariCart</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
  ${opts.previewText ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(opts.previewText)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f7f9;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
              <a href="${url}" style="text-decoration:none;color:#0f172a;font-weight:700;font-size:18px;letter-spacing:-0.01em;">SafariCart</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">${opts.bodyHtml}</td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px;line-height:1.5;">
              <div>SafariCart — Kenya's online marketplace.</div>
              <div>This email was sent to you because of activity on your account.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buttonHtml(href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">${esc(label)}</a>`;
}
