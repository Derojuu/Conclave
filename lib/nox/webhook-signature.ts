import { createHmac, timingSafeEqual } from "node:crypto";

export const NOX_WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000;

export function createNoxCallbackSignature(input: {
  body: string;
  timestamp: string;
  secret: string;
}) {
  return createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.body}`)
    .digest("hex");
}

export function verifyNoxWebhookSignature(input: {
  body: string;
  timestamp: string | null;
  signature: string | null;
  secret: string;
  now?: number;
  maxAgeMs?: number;
}) {
  if (!input.timestamp || !input.signature) {
    return false;
  }

  const timestamp = Number(input.timestamp);
  const now = input.now ?? Date.now();
  const maxAgeMs = input.maxAgeMs ?? NOX_WEBHOOK_MAX_AGE_MS;

  if (
    !Number.isFinite(timestamp) ||
    Math.abs(now - timestamp * 1000) > maxAgeMs
  ) {
    return false;
  }

  const expected = createNoxCallbackSignature({
    body: input.body,
    timestamp: input.timestamp,
    secret: input.secret,
  });
  const received = input.signature.replace(/^sha256=/, "");

  if (
    !/^[a-f0-9]{64}$/.test(received) ||
    expected.length !== received.length
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(received, "hex"),
  );
}
