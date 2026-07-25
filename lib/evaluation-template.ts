import type { EvaluationTemplateInput } from "@/lib/validation/evaluation-template";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function buildCriterionRecords(
  criteria: EvaluationTemplateInput["criteria"],
) {
  const usedKeys = new Set<string>();

  return criteria.map((criterion, position) => {
    const base = slugify(criterion.label) || `criterion-${position + 1}`;
    let key = base;
    let suffix = 2;

    while (usedKeys.has(key)) {
      key = `${base.slice(0, 72)}-${suffix}`;
      suffix += 1;
    }

    usedKeys.add(key);

    return {
      key,
      label: criterion.label,
      description: criterion.description || null,
      type: criterion.type,
      weight: criterion.weight,
      minScore: criterion.minScore,
      maxScore: criterion.maxScore,
      position,
    };
  });
}
