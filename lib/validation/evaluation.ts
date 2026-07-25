import { z } from "zod";

import {
  EVALUATION_ENCRYPTION_ALGORITHM,
  EVALUATION_PAYLOAD_SCHEMA_VERSION,
  EVALUATION_RECOMMENDATIONS,
} from "@/constants/evaluation";

const base64 = z
  .string()
  .min(8)
  .max(2_000_000)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, "Expected base64-encoded data.");

export const confidentialCriterionResponseSchema = z.object({
  criterionId: z.string().uuid(),
  key: z.string().min(1).max(80),
  value: z.union([
    z.number().finite(),
    z.boolean(),
    z.string().trim().min(1).max(5000),
    z.null(),
  ]),
  privateComment: z.string().trim().max(5000).optional(),
});

export const confidentialEvaluationPayloadSchema = z.object({
  schemaVersion: z.literal(EVALUATION_PAYLOAD_SCHEMA_VERSION),
  campaignId: z.string().uuid(),
  submissionId: z.string().uuid(),
  evaluatorRef: z.string().regex(/^[a-f0-9]{64}$/),
  templateId: z.string().uuid(),
  templateVersion: z.number().int().positive(),
  criteria: z.array(confidentialCriterionResponseSchema).min(1).max(100),
  overallRecommendation: z.enum(EVALUATION_RECOMMENDATIONS),
  privateComments: z.string().trim().max(10_000).optional(),
  completed: z.boolean(),
  preparedAt: z.string().datetime({ offset: true }),
});

export const encryptedEvaluationEnvelopeSchema = z.object({
  schemaVersion: z.literal(EVALUATION_PAYLOAD_SCHEMA_VERSION),
  encryptionAlgorithm: z.literal(EVALUATION_ENCRYPTION_ALGORITHM),
  keyReference: z.string().trim().min(1).max(255),
  encryptedKey: base64.max(16_384),
  nonce: base64.max(256),
  ciphertext: base64,
  additionalData: base64.max(16_384),
  payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const evaluationAdditionalDataSchema = z.object({
  schemaVersion: z.literal(EVALUATION_PAYLOAD_SCHEMA_VERSION),
  campaignId: z.string().uuid(),
  submissionId: z.string().uuid(),
  evaluatorRef: z.string().regex(/^[a-f0-9]{64}$/),
  templateId: z.string().uuid(),
  templateVersion: z.number().int().positive(),
});

export type ConfidentialEvaluationPayload = z.infer<
  typeof confidentialEvaluationPayloadSchema
>;
export type EncryptedEvaluationEnvelope = z.infer<
  typeof encryptedEvaluationEnvelopeSchema
>;
