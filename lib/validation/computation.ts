import { z } from "zod";

export const aggregateRankingEntrySchema = z
  .object({
    submissionId: z.string().uuid(),
    rank: z.number().int().positive(),
    score: z.number().finite(),
  })
  .strict();
