import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send a message to the SafariCart team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 md:px-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight">Contact us</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Questions, feedback, or partnership ideas — write to us. We typically
        reply within one business day.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <ContactForm />
      </div>

      <div className="mt-8 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
        <div>
          <div className="font-medium text-foreground">Customer support</div>
          <a
            href="mailto:support@safaricart.co.ke"
            className="hover:text-primary"
          >
            support@safaricart.co.ke
          </a>
        </div>
        <div>
          <div className="font-medium text-foreground">Sales &amp; partnerships</div>
          <a
            href="mailto:sales@safaricart.co.ke"
            className="hover:text-primary"
          >
            sales@safaricart.co.ke
          </a>
        </div>
        <div>
          <div className="font-medium text-foreground">Orders</div>
          <a
            href="mailto:orders@safaricart.co.ke"
            className="hover:text-primary"
          >
            orders@safaricart.co.ke
          </a>
        </div>
        <div>
          <div className="font-medium text-foreground">Office</div>
          <span>Nairobi, Kenya</span>
        </div>
      </div>
    </div>
  );
}
