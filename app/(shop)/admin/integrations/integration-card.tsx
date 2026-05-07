"use client";

import { useActionState, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { IntegrationStatus } from "@/server/integrations";
import {
  saveIntegrationAction,
  toggleIntegrationAction,
  testIntegrationAction,
} from "@/server/actions/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  type?: string;
  help?: string;
};

type Meta = {
  title: string;
  blurb: string;
  docsHref: string;
  publicFields: FieldDef[];
  secretFields: { key: string; label: string; help?: string }[];
  supportsTestMode: boolean;
  testModeLabel?: string;
  webhookHint?: string;
};

export function IntegrationCard({
  status,
  meta,
}: {
  status: IntegrationStatus;
  meta: Meta;
}) {
  const [saveState, saveAction, savePending] = useActionState(
    saveIntegrationAction,
    null,
  );
  const [testState, testAction, testPending] = useActionState(
    testIntegrationAction,
    null,
  );

  const sourceBadge =
    status.source === "db"
      ? { label: "Active (DB)", className: "bg-secondary text-secondary-foreground" }
      : status.source === "env"
        ? { label: "Active (env)", className: "bg-accent text-accent-foreground" }
        : { label: "Not configured", className: "bg-muted text-muted-foreground" };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="font-heading text-lg">{meta.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{meta.blurb}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={sourceBadge.className}>{sourceBadge.label}</Badge>
            {status.envFallbackAvailable && status.source !== "env" && (
              <span className="text-xs text-muted-foreground">
                env fallback available
              </span>
            )}
            {status.hasPlaintextSecrets && (
              <span className="text-xs text-destructive">
                Stored unencrypted
              </span>
            )}
            {status.encryptedAtRest && (
              <span className="text-xs text-secondary">Encrypted</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {meta.webhookHint && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Webhook URL:</strong>{" "}
            <code className="break-all font-mono">{meta.webhookHint}</code>
          </div>
        )}

        {/* Save form */}
        <form action={saveAction} className="flex flex-col gap-4">
          <input type="hidden" name="scope" value={status.scope} />

          {saveState?.error && (
            <Alert variant="destructive">
              <AlertDescription>{saveState.error}</AlertDescription>
            </Alert>
          )}
          {saveState?.success && (
            <Alert>
              <AlertDescription>{saveState.success}</AlertDescription>
            </Alert>
          )}

          {meta.publicFields.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {meta.publicFields.map((f) => (
                <PublicField key={f.key} field={f} initial={status.publicConfig[f.key]} />
              ))}
            </div>
          )}

          {meta.secretFields.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {meta.secretFields.map((f) => (
                <SecretField
                  key={f.key}
                  field={f}
                  hint={status.secretHints[f.key] ?? null}
                  isSet={status.secretFlags[f.key] === "set"}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={savePending}>
              {savePending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>

        {/* Test form (separate so submit hits a different action) */}
        <form action={testAction}>
          <input type="hidden" name="scope" value={status.scope} />
          {testState?.error && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{testState.error}</AlertDescription>
            </Alert>
          )}
          {testState?.success && (
            <Alert className="mb-3">
              <AlertDescription>{testState.success}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="sm" variant="outline" disabled={testPending}>
            {testPending ? "Testing…" : "Test connection"}
          </Button>
        </form>

        {/* Toggle row */}
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
          <ToggleSwitches
            scope={status.scope}
            initialEnabled={status.enabled}
            initialTestMode={status.testMode}
            supportsTestMode={meta.supportsTestMode}
            testModeLabel={meta.testModeLabel}
          />
          {status.updatedAt && (
            <span className="ml-auto text-xs text-muted-foreground">
              Updated {new Date(status.updatedAt).toLocaleString("en-KE")}
            </span>
          )}
        </div>

        <a
          href={meta.docsHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
        >
          Provider docs <ExternalLink className="size-3" />
        </a>
      </CardContent>
    </Card>
  );
}

function PublicField({
  field,
  initial,
}: {
  field: FieldDef;
  initial: unknown;
}) {
  // Special case: boolean checkbox
  if (field.key === "secure") {
    const checked = Boolean(initial);
    return (
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input
          type="checkbox"
          name={field.key}
          defaultChecked={checked}
          className="size-4 rounded border-input"
        />
        {field.label}
      </label>
    );
  }
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={`${field.key}`}>{field.label}</Label>
      <Input
        id={field.key}
        name={field.key}
        type={field.type ?? "text"}
        defaultValue={
          typeof initial === "string" || typeof initial === "number"
            ? String(initial)
            : ""
        }
        placeholder={field.placeholder}
      />
      {field.help && (
        <p className="text-xs text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
}

function SecretField({
  field,
  hint,
  isSet,
}: {
  field: { key: string; label: string; help?: string };
  hint: string | null;
  isSet: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={field.key}>
        {field.label}
        {isSet && (
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            {hint}
          </span>
        )}
      </Label>
      <div className="flex gap-1">
        <Input
          id={field.key}
          name={field.key}
          type={show ? "text" : "password"}
          autoComplete="off"
          placeholder={isSet ? "Leave blank to keep current value" : "Paste new value"}
          className="font-mono text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShow((s) => !s)}
        >
          {show ? "Hide" : "Show"}
        </Button>
      </div>
      {field.help && (
        <p className="text-xs text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
}

function ToggleSwitches({
  scope,
  initialEnabled,
  initialTestMode,
  supportsTestMode,
  testModeLabel,
}: {
  scope: string;
  initialEnabled: boolean;
  initialTestMode: boolean;
  supportsTestMode: boolean;
  testModeLabel?: string;
}) {
  // Each toggle posts to the server action via its own form. We manage the
  // checkbox state locally so changing one doesn't affect the other.
  const [enabled, setEnabled] = useState(initialEnabled);
  const [testMode, setTestMode] = useState(initialTestMode);

  return (
    <form action={toggleIntegrationAction} className="flex flex-wrap items-center gap-4">
      <input type="hidden" name="scope" value={scope} />
      {/* Hidden inputs forward the local state */}
      <input
        type="hidden"
        name="enabled"
        value={enabled ? "on" : "off"}
      />
      <input
        type="hidden"
        name="testMode"
        value={testMode ? "on" : "off"}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-4 rounded border-input"
        />
        <span className="font-medium">Active</span>
      </label>
      {supportsTestMode && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="size-4 rounded border-input"
          />
          <span>{testModeLabel ?? "Test mode"}</span>
        </label>
      )}
      <Button type="submit" size="sm" variant="outline">
        Apply toggle
      </Button>
    </form>
  );
}
