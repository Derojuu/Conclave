import "server-only";

import { EVALUATION_ENCRYPTION_ALGORITHM } from "@/constants/evaluation";
import { ConfigurationError } from "@/lib/security/errors";

export type EvaluationEncryptionConfig = {
  publicKey: string;
  keyReference: string;
  encryptionAlgorithm: typeof EVALUATION_ENCRYPTION_ALGORITHM;
};

function normalizePem(value: string) {
  return value.replaceAll("\\n", "\n").trim();
}

export function getEvaluationEncryptionConfig():
  | EvaluationEncryptionConfig
  | null {
  const publicKey = process.env.NOX_EVALUATION_PUBLIC_KEY?.trim();
  const keyReference = process.env.NOX_EVALUATION_KEY_REFERENCE?.trim();

  if (!publicKey && !keyReference) {
    return null;
  }

  if (!publicKey || !keyReference) {
    throw new ConfigurationError(
      "Nox evaluation encryption requires both NOX_EVALUATION_PUBLIC_KEY and NOX_EVALUATION_KEY_REFERENCE.",
    );
  }

  return {
    publicKey: normalizePem(publicKey),
    keyReference,
    encryptionAlgorithm: EVALUATION_ENCRYPTION_ALGORITHM,
  };
}

export function requireEvaluationEncryptionConfig() {
  const config = getEvaluationEncryptionConfig();

  if (!config) {
    throw new ConfigurationError(
      "Confidential evaluation encryption is not configured.",
    );
  }

  return config;
}
