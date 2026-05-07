import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="flex flex-col gap-4 text-sm leading-relaxed">
      <h1 className="font-heading text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: 2026-05-07</p>

      <p>
        Welcome to SafariCart. These Terms govern your use of the SafariCart
        website and services (the &quot;Platform&quot;). By accessing or using
        the Platform, you agree to be bound by these Terms.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">1. The Platform</h2>
      <p>
        SafariCart is an online marketplace that connects buyers in Kenya with
        independent sellers (&quot;Vendors&quot;). SafariCart facilitates
        transactions but is not a party to any contract of sale between buyers
        and Vendors.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">2. Eligibility</h2>
      <p>
        You must be at least 18 years old, or the age of majority in your
        jurisdiction, to create an account and place orders. By using the
        Platform, you represent that you meet this requirement.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">3. Accounts</h2>
      <p>
        You are responsible for the security of your account credentials and
        for any activity carried out under your account. Notify us immediately
        of any unauthorised use.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">4. Orders & Payment</h2>
      <p>
        Prices are quoted in Kenyan Shillings (KES) and may include or exclude
        delivery fees as indicated at checkout. We accept payment via M-Pesa,
        card networks (through our payment partners) and cash on delivery
        where supported. Orders are subject to product availability.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">5. Vendors</h2>
      <p>
        Vendors are responsible for the accuracy of product listings, lawful
        sale of goods, fulfillment and after-sales support. SafariCart screens
        Vendors but does not guarantee the quality or legality of any item.
        Report concerns to support@safaricart.co.ke.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">6. Refunds & Returns</h2>
      <p>
        See our <a href="/legal/returns">Returns &amp; Refunds Policy</a>.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">7. Prohibited Conduct</h2>
      <p>
        You agree not to misuse the Platform, including by transmitting
        malicious code, scraping data without permission, attempting to
        defraud other users, or selling counterfeit, illegal, or restricted
        goods.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">8. Liability</h2>
      <p>
        To the fullest extent permitted by Kenyan law, SafariCart&apos;s
        liability for any claim arising out of these Terms is limited to the
        amount paid by you for the order in question.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">9. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Republic of Kenya. Any
        dispute shall be subject to the exclusive jurisdiction of the courts
        of Kenya.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">10. Contact</h2>
      <p>
        Questions? Reach us at <a href="mailto:legal@safaricart.co.ke">legal@safaricart.co.ke</a>.
      </p>
    </article>
  );
}
