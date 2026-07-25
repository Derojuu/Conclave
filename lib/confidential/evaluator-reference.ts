import "server-only";

import { createHmac } from "node:crypto";

import { ConfigurationError } from "@/lib/security/errors";

export function getEvaluatorReference(campaignId: string, userId: string) {
  const secret = process.env.EVALUATOR_PSEUDONYM_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new ConfigurationError(
      "EVALUATOR_PSEUDONYM_SECRET must contain at least 32 characters.",
    );
  }

  return createHmac("sha256", secret)
    .update(`${campaignId}:${userId}`)
    .digest("hex");
}
