import { z } from "zod";

import { CAMPAIGN_STATUSES } from "@/constants/campaign";

const optionalDeadline = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional();

export const campaignSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Campaign title must contain at least 2 characters.")
    .max(160, "Campaign title must contain at most 160 characters."),
  description: z
    .string()
    .trim()
    .min(2, "Campaign description must contain at least 2 characters.")
    .max(5000, "Campaign description must contain at most 5000 characters."),
  deadline: optionalDeadline,
  evaluationTemplateId: z.string().uuid().nullable().optional(),
});

export const campaignStatusSchema = z.object({
  status: z.enum(CAMPAIGN_STATUSES),
});

export const campaignEvaluatorSchema = z.object({
  userId: z.string().uuid(),
});

export const campaignDeleteSchema = z.object({
  confirmation: z.string().trim().min(1),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
