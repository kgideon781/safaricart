import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import {
  getAllIntegrationStatuses,
  type IntegrationStatus,
} from "@/server/integrations";
import { encryptionKeyAvailable } from "@/server/crypto";
import { publicAppUrl } from "@/server/env";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IntegrationCard } from "./integration-card";

export const metadata: Metadata = { title: "Admin · Integrations" };

const baseUrl = (() => {
  try {
    return publicAppUrl().replace(/\/$/, "");
  } catch {
    return "";
  }
})();

const SCOPE_META: Record<
  IntegrationStatus["scope"],
  {
    title: string;
    blurb: string;
    docsHref: string;
    publicFields: { key: string; label: string; placeholder?: string; type?: string }[];
    secretFields: { key: string; label: string; help?: string }[];
    supportsTestMode: boolean;
    testModeLabel?: string;
    webhookHint?: string;
  }
> = {
  mpesa: {
    title: "M-Pesa (Daraja)",
    blurb:
      "Lipa Na M-Pesa Online (STK push). Sandbox shortcode 174379 + sandbox passkey are baked in if left blank.",
    docsHref: "https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate",
    publicFields: [
      { key: "shortcode", label: "Business Short Code (Paybill / Till)", placeholder: "174379" },
      {
        key: "callbackUrl",
        label: "Callback URL (HTTPS)",
        placeholder: `${baseUrl}/api/webhooks/mpesa`,
      },
    ],
    secretFields: [
      { key: "consumerKey", label: "Consumer key" },
      { key: "consumerSecret", label: "Consumer secret" },
      { key: "passkey", label: "LNM passkey", help: "Lipa Na M-Pesa Online passkey" },
    ],
    supportsTestMode: true,
    testModeLabel: "Sandbox",
    webhookHint: `Set this URL as your Daraja callback: ${baseUrl}/api/webhooks/mpesa`,
  },
  stripe: {
    title: "Stripe",
    blurb: "Card payments via Stripe Checkout (KES). Required for international cards.",
    docsHref: "https://dashboard.stripe.com/apikeys",
    publicFields: [
      {
        key: "publishableKey",
        label: "Publishable key (pk_...)",
        placeholder: "pk_live_...",
      },
    ],
    secretFields: [
      { key: "secretKey", label: "Secret key (sk_...)" },
      { key: "webhookSecret", label: "Webhook signing secret (whsec_...)" },
    ],
    supportsTestMode: true,
    testModeLabel: "Test mode",
    webhookHint: `Add this URL as a webhook endpoint in Stripe: ${baseUrl}/api/webhooks/stripe (events: checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded)`,
  },
  paystack: {
    title: "Paystack",
    blurb: "Card / mobile money via Paystack hosted checkout.",
    docsHref: "https://dashboard.paystack.com/#/settings/developer",
    publicFields: [
      {
        key: "publicKey",
        label: "Public key (pk_...)",
        placeholder: "pk_live_...",
      },
    ],
    secretFields: [{ key: "secretKey", label: "Secret key (sk_...)" }],
    supportsTestMode: true,
    testModeLabel: "Test mode",
    webhookHint: `Add this URL as a webhook in Paystack: ${baseUrl}/api/webhooks/paystack`,
  },
  smtp: {
    title: "SMTP (Email)",
    blurb:
      "Outbound email — order confirmations, password resets, vendor notifications. Works with Gmail App Passwords, Mailtrap, SendGrid SMTP, Zoho, etc.",
    docsHref: "https://nodemailer.com/smtp/",
    publicFields: [
      { key: "host", label: "SMTP host", placeholder: "smtp.gmail.com" },
      { key: "port", label: "Port", placeholder: "587", type: "number" },
      { key: "secure", label: "Use TLS (port 465)" },
      { key: "user", label: "Username", placeholder: "you@example.com" },
      {
        key: "from",
        label: "From address",
        placeholder: "SafariCart <no-reply@safaricart.co.ke>",
      },
    ],
    secretFields: [{ key: "pass", label: "Password" }],
    supportsTestMode: false,
  },
  cloudinary: {
    title: "Cloudinary (Uploads)",
    blurb: "Product photos, vendor logos and KYC documents.",
    docsHref: "https://cloudinary.com/console",
    publicFields: [
      { key: "cloudName", label: "Cloud name" },
      { key: "uploadFolder", label: "Upload folder", placeholder: "safaricart" },
    ],
    secretFields: [
      { key: "apiKey", label: "API key" },
      { key: "apiSecret", label: "API secret" },
    ],
    supportsTestMode: false,
  },
};

export default async function AdminIntegrationsPage() {
  const statuses = await getAllIntegrationStatuses();
  const keyAvailable = encryptionKeyAvailable();
  const anyPlaintextSecrets = statuses.some((s) => s.hasPlaintextSecrets);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Live credentials for payments, email and uploads. Save your keys,
          test the connection, then flip the switch to activate.
        </p>
      </div>

      {!keyAvailable && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            <strong>Secrets are stored unencrypted.</strong>{" "}
            <code className="font-mono text-xs">SETTINGS_ENCRYPTION_KEY</code>{" "}
            is not set in your env, so anything you save here lands in the
            database in plaintext. To upgrade to AES-256 encryption at rest,
            generate a key with{" "}
            <code className="font-mono text-xs">openssl rand -base64 32</code>,
            add it to your env, restart, then re-save each card to re-encrypt
            existing values.
          </AlertDescription>
        </Alert>
      )}

      {keyAvailable && anyPlaintextSecrets && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Some saved credentials predate your encryption key and are still
            stored in plaintext. Open each affected card and click{" "}
            <strong>Save</strong> (no need to retype) to upgrade them to
            encrypted storage.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">How this works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Save</strong> a card to store keys in the DB
              (secrets are encrypted with{" "}
              <code className="font-mono text-xs">SETTINGS_ENCRYPTION_KEY</code>).
            </li>
            <li>
              <strong>Test</strong> calls the provider's API with your keys
              to verify they work.
            </li>
            <li>
              <strong>Activate</strong> flips the switch — every server
              request from then on uses your DB credentials, falling back
              to env only if disabled.
            </li>
            <li>
              Existing values appear masked (last 4 chars). Leave a secret
              field blank to keep its current value.
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-5">
        {statuses.map((status) => (
          <IntegrationCard
            key={status.scope}
            status={status}
            meta={SCOPE_META[status.scope]}
          />
        ))}
      </div>
    </div>
  );
}
