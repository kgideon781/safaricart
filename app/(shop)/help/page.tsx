import Link from "next/link";
import type { Metadata } from "next";
import { LifeBuoy, Mail, MessageSquare, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Help center",
  description:
    "Answers to common questions about SafariCart — orders, payments, shipping, returns, vendor accounts, and custom quotes.",
};

const SECTIONS: { id: string; title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    id: "ordering",
    title: "Ordering & payments",
    items: [
      {
        q: "How do I place an order?",
        a: (
          <>
            Add items to your cart, head to checkout, pick a delivery address,
            then choose how you want to pay. You&apos;ll get a confirmation
            email from <strong>orders@safaricart.co.ke</strong> the moment
            payment clears.
          </>
        ),
      },
      {
        q: "Which payment methods do you accept?",
        a: (
          <>
            M-Pesa, Airtel Money, Visa &amp; Mastercard, and cash on delivery
            in selected counties. M-Pesa is processed through Safaricom
            Daraja&apos;s STK push — you&apos;ll get a prompt on your phone to
            enter your PIN.
          </>
        ),
      },
      {
        q: "I paid but my order still shows as pending — what now?",
        a: (
          <>
            M-Pesa confirmations usually arrive within 30 seconds. If your
            order is still pending after 5 minutes, check your phone for an
            M-Pesa SMS — the receipt number tells us the payment went
            through. Forward it to{" "}
            <a className="underline" href="mailto:support@safaricart.co.ke">
              support@safaricart.co.ke
            </a>{" "}
            and we&apos;ll reconcile it manually.
          </>
        ),
      },
      {
        q: "Can I change or cancel an order after placing it?",
        a: (
          <>
            Yes — until a vendor marks an item as shipped. Open the order from{" "}
            <Link className="underline" href="/account/orders">
              My orders
            </Link>{" "}
            and request cancellation. After shipping, it becomes a return
            (see below).
          </>
        ),
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: (
          <>
            Nairobi metro: same-day or next-day for in-stock items. Other
            major towns: 1–3 business days. Remote areas: 3–5 business days.
            Full details on the{" "}
            <Link className="underline" href="/help/shipping">
              shipping &amp; delivery
            </Link>{" "}
            page.
          </>
        ),
      },
      {
        q: "Do you deliver to all 47 counties?",
        a: (
          <>
            Yes. Some remote areas may have longer lead times or use a partner
            courier for the last mile.
          </>
        ),
      },
      {
        q: "How much is shipping?",
        a: (
          <>
            Calculated at checkout based on the destination county and the
            weight of your items. Many vendors offer free shipping within
            Nairobi above a minimum order value.
          </>
        ),
      },
      {
        q: "How do I track my order?",
        a: (
          <>
            Open{" "}
            <Link className="underline" href="/account/orders">
              My orders
            </Link>
            . Each item shows its fulfillment status — pending, fulfilling,
            shipped, delivered. If you placed an order as a guest, use{" "}
            <Link className="underline" href="/orders/track">
              Track an order
            </Link>{" "}
            with your order number and email.
          </>
        ),
      },
    ],
  },
  {
    id: "returns",
    title: "Returns & refunds",
    items: [
      {
        q: "What's your return window?",
        a: (
          <>
            7 days from delivery for most items. See the{" "}
            <Link className="underline" href="/legal/returns">
              Returns &amp; Refunds
            </Link>{" "}
            policy in full — perishables, hygiene products, and custom orders
            are not returnable.
          </>
        ),
      },
      {
        q: "How long do refunds take?",
        a: (
          <>
            M-Pesa: 1–3 business days. Card refunds: 3–7 business days,
            depending on your bank.
          </>
        ),
      },
      {
        q: "The item arrived damaged. What do I do?",
        a: (
          <>
            Take a photo of the package and the damaged item, then send it via
            the{" "}
            <Link className="underline" href="/contact">
              contact form
            </Link>{" "}
            within 48 hours. We&apos;ll arrange a replacement or refund.
          </>
        ),
      },
    ],
  },
  {
    id: "account",
    title: "Account & security",
    items: [
      {
        q: "How do I reset my password?",
        a: (
          <>
            On the sign-in page, click &quot;Forgot password&quot; and enter
            your email. We&apos;ll send a reset link from{" "}
            <strong>no-reply@safaricart.co.ke</strong> — valid for one hour.
          </>
        ),
      },
      {
        q: "I'm not receiving the verification email — what should I check?",
        a: (
          <>
            Check spam/junk first. If still missing, try a different email
            provider or write to{" "}
            <a className="underline" href="mailto:support@safaricart.co.ke">
              support@safaricart.co.ke
            </a>{" "}
            and we&apos;ll verify you manually.
          </>
        ),
      },
      {
        q: "How do I delete my account?",
        a: (
          <>
            Send a request from the email on file to{" "}
            <a className="underline" href="mailto:support@safaricart.co.ke">
              support@safaricart.co.ke
            </a>
            . We&apos;ll remove your account within 7 days, except for
            transaction records we must retain for KRA compliance.
          </>
        ),
      },
    ],
  },
  {
    id: "vendors",
    title: "Selling on SafariCart",
    items: [
      {
        q: "How do I become a vendor?",
        a: (
          <>
            Start at{" "}
            <Link className="underline" href="/vendor/register">
              Become a vendor
            </Link>
            . You&apos;ll need your business name, county, contact email and
            phone, plus KYC documents (national ID, business certificate if
            applicable, KRA PIN). Approval usually takes 1–2 business days.
          </>
        ),
      },
      {
        q: "What does it cost?",
        a: (
          <>
            No upfront fees. SafariCart takes a 10% commission on each sale —
            the rest is paid out to you. Details on the{" "}
            <Link className="underline" href="/vendor/fees">
              fees page
            </Link>
            .
          </>
        ),
      },
      {
        q: "When do I get paid?",
        a: (
          <>
            Earnings credit to your ledger when an order is marked delivered.
            Request a payout from the vendor dashboard — M-Pesa or bank
            transfer.
          </>
        ),
      },
      {
        q: "How do I bulk-upload my catalog?",
        a: (
          <>
            From the vendor dashboard, open <em>Products</em> → <em>Bulk
            upload</em>. Download the CSV template, fill in one row per
            product, and re-upload — up to 500 rows per file.
          </>
        ),
      },
    ],
  },
  {
    id: "quotes",
    title: "Custom quote requests",
    items: [
      {
        q: "Can SafariCart source items not listed on the site?",
        a: (
          <>
            Yes. Submit a request at{" "}
            <Link className="underline" href="/request-quote">
              Request a quote
            </Link>{" "}
            with details and (optionally) reference photos. Our sourcing team
            comes back with a price within 1–2 business days. Track your
            requests under{" "}
            <Link className="underline" href="/account/quotes">
              My quote requests
            </Link>
            .
          </>
        ),
      },
      {
        q: "How long is a quote valid?",
        a: (
          <>
            7 days by default. The exact validity date is always shown on the
            quote — for fast-moving categories we may set a shorter window.
          </>
        ),
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Help center
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Answers to the questions we get most. Can&apos;t find what you need?{" "}
          <Link href="/contact" className="text-primary underline-offset-2 hover:underline">
            Get in touch
          </Link>
          {" "}— we usually reply within one business day.
        </p>
      </div>

      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <ShortcutCard
          icon={Search}
          label="Track an order"
          value="My orders"
          href="/account/orders"
        />
        <ShortcutCard
          icon={Mail}
          label="Email us"
          value="support@safaricart.co.ke"
          href="mailto:support@safaricart.co.ke"
        />
        <ShortcutCard
          icon={MessageSquare}
          label="Contact form"
          value="Send a message"
          href="/contact"
        />
      </div>

      <nav className="mb-10 rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-medium">Jump to a topic</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="rounded-full border border-border px-3 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-10">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-20">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {section.title}
            </h2>
            <div className="mt-4 flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
              {section.items.map((item, i) => (
                <details key={i} className="group p-4">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 font-medium">
                    <span>{item.q}</span>
                    <span className="text-muted-foreground transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-dashed border-border bg-card p-6 text-center">
        <LifeBuoy className="mx-auto mb-2 size-8 text-muted-foreground" />
        <h3 className="font-heading text-lg font-semibold">
          Still need a hand?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Our team is in Nairobi and replies within one business day.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}

function ShortcutCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
    >
      <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block text-sm font-medium">{value}</span>
      </span>
    </Link>
  );
}
