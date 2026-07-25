import {
  EVALUATION_ENCRYPTION_ALGORITHM,
  EVALUATION_PAYLOAD_SCHEMA_VERSION,
} from "@/constants/evaluation";
import type {
  ConfidentialEvaluationPayload,
  EncryptedEvaluationEnvelope,
} from "@/lib/validation/evaluation";

const encoder = new TextEncoder();

function bytesToBase64(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function encryptEvaluationPayload(input: {
  payload: ConfidentialEvaluationPayload;
  publicKey: string;
  keyReference: string;
}): Promise<EncryptedEvaluationEnvelope> {
  const additionalDataObject = {
    schemaVersion: EVALUATION_PAYLOAD_SCHEMA_VERSION,
    campaignId: input.payload.campaignId,
    submissionId: input.payload.submissionId,
    evaluatorRef: input.payload.evaluatorRef,
    templateId: input.payload.templateId,
    templateVersion: input.payload.templateVersion,
  };
  const additionalDataBytes = encoder.encode(
    JSON.stringify(additionalDataObject),
  );
  const additionalData = bytesToBase64(additionalDataBytes);
  const nonceBytes = crypto.getRandomValues(new Uint8Array(12));
  const contentKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"],
  );
  const ciphertextBytes = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonceBytes,
      additionalData: additionalDataBytes,
      tagLength: 128,
    },
    contentKey,
    encoder.encode(JSON.stringify(input.payload)),
  );
  const rawContentKey = await crypto.subtle.exportKey("raw", contentKey);
  const wrappingKey = await crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(input.publicKey),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  const encryptedKeyBytes = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    wrappingKey,
    rawContentKey,
  );
  const envelopeWithoutHash = {
    schemaVersion: EVALUATION_PAYLOAD_SCHEMA_VERSION,
    encryptionAlgorithm: EVALUATION_ENCRYPTION_ALGORITHM,
    keyReference: input.keyReference,
    encryptedKey: bytesToBase64(encryptedKeyBytes),
    nonce: bytesToBase64(nonceBytes),
    ciphertext: bytesToBase64(ciphertextBytes),
    additionalData,
  };
  const hashMaterial = [
    envelopeWithoutHash.schemaVersion,
    envelopeWithoutHash.encryptionAlgorithm,
    envelopeWithoutHash.keyReference,
    envelopeWithoutHash.encryptedKey,
    envelopeWithoutHash.nonce,
    envelopeWithoutHash.ciphertext,
    envelopeWithoutHash.additionalData,
  ].join(".");

  return {
    ...envelopeWithoutHash,
    payloadHash: await sha256Hex(hashMaterial),
  };
}
