import { z } from "zod";

import { EVALUATION_SCORE_TYPES } from "@/constants/evaluation-template";

export const evaluationCriterionSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(2, "Criterion name must contain at least 2 characters.")
      .max(160, "Criterion name must contain at most 160 characters."),
    description: z
      .string()
      .trim()
      .max(2000, "Criterion guidance must contain at most 2000 characters."),
    type: z.enum(EVALUATION_SCORE_TYPES),
    weight: z
      .number()
      .finite()
      .min(0.01, "Weight must be at least 0.01.")
      .max(100, "Weight cannot exceed 100."),
    minScore: z
      .number()
      .finite()
      .min(-1_000_000, "Minimum score is too small.")
      .max(1_000_000, "Minimum score is too large."),
    maxScore: z
      .number()
      .finite()
      .min(-1_000_000, "Maximum score is too small.")
      .max(1_000_000, "Maximum score is too large."),
  })
  .superRefine((criterion, context) => {
    if (criterion.maxScore <= criterion.minScore) {
      context.addIssue({
        code: "custom",
        message: "Maximum score must be greater than minimum score.",
        path: ["maxScore"],
      });
    }

    if (
      criterion.type === "STAR" &&
      (!Number.isInteger(criterion.minScore) ||
        !Number.isInteger(criterion.maxScore) ||
        criterion.minScore < 1 ||
        criterion.maxScore > 10)
    ) {
      context.addIssue({
        code: "custom",
        message: "Star scores must use whole numbers between 1 and 10.",
        path: ["maxScore"],
      });
    }

    if (
      criterion.type === "PASS_FAIL" &&
      (criterion.minScore !== 0 || criterion.maxScore !== 1)
    ) {
      context.addIssue({
        code: "custom",
        message: "Pass / fail criteria must use a 0 to 1 score range.",
        path: ["maxScore"],
      });
    }
  });

export const evaluationTemplateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Template title must contain at least 2 characters.")
      .max(160, "Template title must contain at most 160 characters."),
    description: z
      .string()
      .trim()
      .max(2000, "Description must contain at most 2000 characters."),
    instructions: z
      .string()
      .trim()
      .max(10_000, "Instructions must contain at most 10000 characters."),
    deadline: z.string().datetime({ offset: true }).nullable(),
    isDefault: z.boolean(),
    criteria: z
      .array(evaluationCriterionSchema)
      .min(1, "Add at least one evaluation criterion.")
      .max(50, "A template can contain at most 50 criteria."),
  })
  .superRefine((template, context) => {
    const labels = new Set<string>();

    template.criteria.forEach((criterion, index) => {
      const normalized = criterion.label.toLowerCase();

      if (labels.has(normalized)) {
        context.addIssue({
          code: "custom",
          message: "Criterion names must be unique.",
          path: ["criteria", index, "label"],
        });
      }

      labels.add(normalized);
    });
  });

export const evaluationTemplateDeleteSchema = z.object({
  confirmation: z.string().trim().min(1),
});

export type EvaluationTemplateInput = z.infer<typeof evaluationTemplateSchema>;
