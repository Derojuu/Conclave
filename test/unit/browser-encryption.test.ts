import assert from "node:assert/strict";
import test from "node:test";

import { webcrypto } from "node:crypto";

import { encryptEvaluationPayload } from "@/lib/confidential/browser-encryption";
import type { ConfidentialEvaluationPayload } from "@/lib/validation/evaluation";

function toPem(value: ArrayBuffer) {
  const base64 = Buffer.from(value).toString("base64");
  const lines = base64.match(/.{1,64}/g)?.join("\n") ?? base64;
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

test("browser encryption seals and unwraps a confidential evaluation", async () => {
  const keyPair = await webcrypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
  const publicKey = toPem(
    await webcrypto.subtle.exportKey("spki", keyPair.publicKey),
  );
  const payload: ConfidentialEvaluationPayload = {
    schemaVersion: 1,
    campaignId: "11111111-1111-4111-8111-111111111111",
    submissionId: "22222222-2222-4222-8222-222222222222",
    evaluatorRef: "a".repeat(64),
    templateId: "33333333-3333-4333-8333-333333333333",
    templateVersion: 1,
    criteria: [
      {
        criterionId: "44444444-4444-4444-8444-444444444444",
        key: "execution",
        value: 8,
        privateComment: "Strong execution.",
      },
    ],
    overallRecommendation: "RECOMMEND",
    privateComments: "Proceed after aggregate review.",
    completed: true,
    preparedAt: "2026-07-25T10:00:00.000Z",
  };

  const envelope = await encryptEvaluationPayload({
    payload,
    publicKey,
    keyReference: "nox-key-v1",
  });
  const rawContentKey = await webcrypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    keyPair.privateKey,
    Buffer.from(envelope.encryptedKey, "base64"),
  );
  const contentKey = await webcrypto.subtle.importKey(
    "raw",
    rawContentKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const plaintext = await webcrypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: Buffer.from(envelope.nonce, "base64"),
      additionalData: Buffer.from(envelope.additionalData, "base64"),
      tagLength: 128,
    },
    contentKey,
    Buffer.from(envelope.ciphertext, "base64"),
  );

  assert.deepEqual(
    JSON.parse(new TextDecoder().decode(plaintext)),
    payload,
  );
  assert.equal(envelope.encryptionAlgorithm, "RSA-OAEP-256+A256GCM");
  assert.match(envelope.payloadHash, /^[a-f0-9]{64}$/);
  assert.equal(envelope.ciphertext.includes(payload.privateComments!), false);
});
