import assert from "node:assert/strict";
import test from "node:test";

import {
  createNoxCallbackSignature,
  verifyNoxWebhookSignature,
} from "@/lib/nox/webhook-signature";

const secret = "a-production-length-webhook-secret-value";
const body = JSON.stringify({ status: "SUCCEEDED", jobId: "job-1" });
const now = Date.UTC(2026, 6, 25, 10, 0, 0);
const timestamp = String(Math.floor(now / 1000));
const signature = createNoxCallbackSignature({
  body,
  timestamp,
  secret,
});

test("accepts a correctly signed current callback", () => {
  assert.equal(
    verifyNoxWebhookSignature({
      body,
      timestamp,
      signature: `sha256=${signature}`,
      secret,
      now,
    }),
    true,
  );
});

test("rejects tampered bodies and malformed signatures", () => {
  assert.equal(
    verifyNoxWebhookSignature({
      body: `${body} `,
      timestamp,
      signature,
      secret,
      now,
    }),
    false,
  );
  assert.equal(
    verifyNoxWebhookSignature({
      body,
      timestamp,
      signature: "not-a-signature",
      secret,
      now,
    }),
    false,
  );
});

test("rejects callbacks outside the five-minute replay window", () => {
  assert.equal(
    verifyNoxWebhookSignature({
      body,
      timestamp,
      signature,
      secret,
      now: now + 5 * 60 * 1000 + 1,
    }),
    false,
  );
});
