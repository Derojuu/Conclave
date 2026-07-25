import "server-only";

import { createHash } from "node:crypto";

import { verifyNoxWebhookSignature } from "@/lib/nox/webhook-signature";
import { ConfigurationError } from "@/lib/security/errors";

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .map(
      (key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`,
    );

  return `{${entries.join(",")}}`;
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyNoxCallbackSignature(input: {
  body: string;
  timestamp: string | null;
  signature: string | null;
}) {
  const secret = process.env.NOX_WEBHOOK_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new ConfigurationError(
      "NOX_WEBHOOK_SECRET must contain at least 32 characters.",
    );
  }

  return verifyNoxWebhookSignature({
    ...input,
    secret,
  });
}
