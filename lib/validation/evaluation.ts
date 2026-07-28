import { z } from "zod";

const hex = z.string().regex(/^0x[a-fA-F0-9]+$/);

export const noxEvaluationSubmissionSchema = z
  .object({
    handle: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    handleProof: hex.min(4).max(100_000),
    transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    chainId: z.literal(11_155_111),
    scoreScale: z.literal(1_000_000),
  })
  .strict();
