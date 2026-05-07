import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-4 text-sm leading-relaxed">
      <h1 className="font-heading text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: 2026-05-07</p>

      <p>
        SafariCart (&quot;we&quot;, &quot;us&quot;) is committed to protecting
        your personal data in accordance with the Kenya Data Protection Act,
        2019 (the &quot;DPA&quot;). This Policy explains what we collect, how
        we use it, and your rights.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">1. Data we collect</h2>
      <ul className="list-disc pl-5">
        <li>Account details: name, email, phone, password hash.</li>
        <li>Order details: addresses, items purchased, delivery preferences.</li>
        <li>Payment metadata (we do not store card numbers — handled by Stripe / Paystack).</li>
        <li>Device data: IP address, browser, pages viewed (used for fraud and analytics).</li>
      </ul>

      <h2 className="mt-4 font-heading text-xl font-semibold">2. How we use it</h2>
      <ul className="list-disc pl-5">
        <li>To fulfill orders and deliver products you purchase.</li>
        <li>To verify accounts, prevent fraud, and enforce our Terms.</li>
        <li>To send transactional emails (order updates, password resets).</li>
        <li>To improve the Platform and personalise recommendations.</li>
      </ul>

      <h2 className="mt-4 font-heading text-xl font-semibold">3. Sharing</h2>
      <p>
        We share order details with the relevant Vendor and delivery partner
        only as needed to fulfill your order. We do not sell personal data.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">4. Data subject rights</h2>
      <p>
        Under the DPA you have the right to access, correct, or delete your
        personal data, to object to certain processing, and to lodge a
        complaint with the Office of the Data Protection Commissioner. To
        exercise these rights, contact{" "}
        <a href="mailto:privacy@safaricart.co.ke">privacy@safaricart.co.ke</a>.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">5. Retention</h2>
      <p>
        We retain order records for at least 7 years to satisfy tax and
        accounting obligations under Kenyan law. Other data is kept only as
        long as needed for the purposes above.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">6. Security</h2>
      <p>
        We use TLS encryption, password hashing, and access controls to
        protect your data. No system is perfectly secure — please use a
        strong, unique password.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">7. Cookies</h2>
      <p>
        See our <a href="/legal/cookies">Cookies Policy</a>.
      </p>

      <h2 className="mt-4 font-heading text-xl font-semibold">8. Contact</h2>
      <p>
        Data Protection Officer: <a href="mailto:privacy@safaricart.co.ke">privacy@safaricart.co.ke</a>.
      </p>
    </article>
  );
}
