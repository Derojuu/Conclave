import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import type { EncryptedEvaluationEnvelope } from "@/lib/validation/evaluation";

export function getEnvelopeHashMaterial(
  envelope: Omit<EncryptedEvaluationEnvelope, "payloadHash">,
) {
  return [
    envelope.schemaVersion,
    envelope.encryptionAlgorithm,
    envelope.keyReference,
    envelope.encryptedKey,
    envelope.nonce,
    envelope.ciphertext,
    envelope.additionalData,
  ].join(".");
}

export function computeEnvelopeHash(
  envelope: Omit<EncryptedEvaluationEnvelope, "payloadHash">,
) {
  return createHash("sha256")
    .update(getEnvelopeHashMaterial(envelope))
    .digest("hex");
}

export function envelopeHashMatches(envelope: EncryptedEvaluationEnvelope) {
  const actual = Buffer.from(
    computeEnvelopeHash({
      schemaVersion: envelope.schemaVersion,
      encryptionAlgorithm: envelope.encryptionAlgorithm,
      keyReference: envelope.keyReference,
      encryptedKey: envelope.encryptedKey,
      nonce: envelope.nonce,
      ciphertext: envelope.ciphertext,
      additionalData: envelope.additionalData,
    }),
    "hex",
  );
  const expected = Buffer.from(envelope.payloadHash, "hex");

  return (
    actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}
