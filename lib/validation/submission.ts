import { z } from "zod";

import {
  SUBMISSION_LINK_TYPES,
  SUBMISSION_STATUSES,
} from "@/constants/submission";

const httpUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL must use HTTP or HTTPS.");

export const submissionLinkSchema = z.object({
  type: z.enum(SUBMISSION_LINK_TYPES),
  label: z
    .string()
    .trim()
    .min(1, "Link label is required.")
    .max(120, "Link label must contain at most 120 characters."),
  url: httpUrl,
});

export const submissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Submission title must contain at least 2 characters.")
    .max(180, "Submission title must contain at most 180 characters."),
  description: z
    .string()
    .trim()
    .min(2, "Submission description must contain at least 2 characters.")
    .max(5000, "Submission description must contain at most 5000 characters."),
  kind: z
    .string()
    .trim()
    .max(80, "Submission type must contain at most 80 characters.")
    .optional()
    .or(z.literal("")),
  metadata: z.record(z.string(), z.string()).default({}),
  links: z.array(submissionLinkSchema).max(12).default([]),
});

export const submissionStatusSchema = z.object({
  status: z.enum(SUBMISSION_STATUSES),
});

export const submissionContributorSchema = z.object({
  userId: z.string().uuid(),
});

export const submissionDeleteSchema = z.object({
  confirmation: z.string().trim().min(1),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
