import "server-only";

import {
  ConfigurationError,
  ExternalServiceError,
} from "@/lib/security/errors";
import { noxSubmissionResponseSchema } from "@/lib/validation/computation";

export type NoxComputationRequest = {
  schemaVersion: 1;
  jobId: string;
  inputCommitment: string;
  callbackUrl: string;
  campaign: {
    id: string;
    title: string;
    deadline: string | null;
    template: {
      id: string;
      version: number;
      instructions: string;
      criteria: Array<{
        id: string;
        key: string;
        label: string;
        type: string;
        weight: number;
        minScore: number;
        maxScore: number;
      }>;
    };
  };
  submissions: Array<{
    id: string;
    title: string;
    metadata: unknown;
  }>;
  encryptedEvaluations: Array<{
    evaluationRef: string;
    submissionId: string;
    ciphertext: string;
    encryptedKey: string;
    encryptionAlgorithm: string;
    keyReference: string;
    nonce: string;
    additionalData: string;
    payloadHash: string;
    schemaVersion: number;
  }>;
};

function getNoxGatewayConfig() {
  const endpoint = process.env.NOX_COMPUTATION_ENDPOINT?.trim();
  const apiKey = process.env.NOX_COMPUTATION_API_KEY?.trim();

  if (!endpoint || !apiKey) {
    throw new ConfigurationError(
      "NOX_COMPUTATION_ENDPOINT and NOX_COMPUTATION_API_KEY are required.",
    );
  }

  try {
    new URL(endpoint);
  } catch {
    throw new ConfigurationError(
      "NOX_COMPUTATION_ENDPOINT must be a valid URL.",
    );
  }

  return { endpoint, apiKey };
}

export async function submitNoxComputation(
  input: NoxComputationRequest,
) {
  const config = getNoxGatewayConfig();
  let response: Response;

  try {
    response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
        "idempotency-key": input.jobId,
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new ExternalServiceError(
      "The iExec Nox computation gateway could not be reached.",
    );
  }

  if (!response.ok) {
    throw new ExternalServiceError(
      `The iExec Nox gateway rejected the computation request (${response.status}).`,
    );
  }

  try {
    return noxSubmissionResponseSchema.parse(await response.json());
  } catch {
    throw new ExternalServiceError(
      "The iExec Nox gateway returned an invalid response.",
    );
  }
}
