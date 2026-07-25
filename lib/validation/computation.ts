import { z } from "zod";

const transactionHash = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const commitment = z.string().regex(/^[a-f0-9]{64}$/);

export const noxSubmissionResponseSchema = z
  .object({
    providerTaskId: z.string().trim().min(1).max(160),
    providerDealId: z.string().trim().min(1).max(160).optional(),
    status: z.enum(["QUEUED", "RUNNING"]),
    chainId: z.number().int().positive().optional(),
    appAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .optional(),
    workerpoolAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .optional(),
  })
  .strict();

export const aggregateRankingEntrySchema = z
  .object({
    submissionId: z.string().uuid(),
    rank: z.number().int().positive(),
    score: z.number().finite(),
  })
  .strict();

const forbiddenAggregateStatisticKey =
  /(evaluator|reviewer|judge|individual|identity|email|wallet|comment|ciphertext|payload)/i;

const aggregateStatisticsSchema = z
  .record(
    z.string().trim().min(1).max(120),
    z.union([z.string().max(1000), z.number().finite(), z.boolean(), z.null()]),
  )
  .refine(
    (statistics) =>
      Object.keys(statistics).length <= 100 &&
      Object.keys(statistics).every(
        (key) => !forbiddenAggregateStatisticKey.test(key),
      ),
    "Statistics may contain aggregate metrics only.",
  );

const aggregateResultSchema = z
  .object({
    selectedSubmissionId: z.string().uuid().nullable(),
    decision: z.string().trim().min(1).max(255),
    overallScore: z.number().finite().nullable(),
    ranking: z.array(aggregateRankingEntrySchema).max(10_000).default([]),
    summary: z.string().trim().min(1).max(20_000),
    consensusSummary: z.string().trim().min(20).max(20_000),
    statistics: aggregateStatisticsSchema.default({}),
  })
  .strict();

export const noxComputationCallbackSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("SUCCEEDED"),
      providerTaskId: z.string().trim().min(1).max(160),
      providerDealId: z.string().trim().min(1).max(160).optional(),
      chainId: z.number().int().positive(),
      transactionHash,
      receiptHash: commitment,
      resultCommitment: commitment,
      result: aggregateResultSchema,
    })
    .strict(),
  z
    .object({
      status: z.literal("FAILED"),
      providerTaskId: z.string().trim().min(1).max(160).optional(),
      errorCode: z.string().trim().min(1).max(120),
      errorMessage: z.string().trim().min(1).max(5000),
    })
    .strict(),
]);

export type NoxComputationCallback = z.infer<
  typeof noxComputationCallbackSchema
>;
