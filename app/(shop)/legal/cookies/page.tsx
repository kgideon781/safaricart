import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookies Policy" };

export default function CookiesPage() {
  return (
    <article className="flex flex-col gap-4 text-sm leading-relaxed">
      <h1 className="font-heading text-3xl font-bold">Cookies Policy</h1>
      <p className="text-muted-foreground">Last updated: 2026-05-07</p>

      <p>
        We use cookies and similar technologies to keep you signed in,
        remember your cart, and understand how the Platform is used.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">Strictly necessary</h2>
      <ul className="list-disc pl-5">
        <li>
          <code>authjs.session-token</code> — keeps you signed in.
        </li>
        <li>
          <code>sc_cart</code> — stores your cart while you&apos;re browsing as
          a guest.
        </li>
        <li>CSRF tokens — protect against cross-site request forgery.</li>
      </ul>

      <h2 className="mt-4 font-heading text-xl font-semibold">Analytics</h2>
      <p>
        We may use first-party analytics to understand traffic patterns. You
        can disable analytics by clicking &quot;Decline&quot; in our cookie
        banner; this does not affect strictly necessary cookies.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">Managing cookies</h2>
      <p>
        You can clear cookies any time from your browser settings. Note that
        disabling strictly necessary cookies will sign you out and clear your
        cart.
      </p>
    </article>
  );
}
