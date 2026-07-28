import { NOX_SCORE_SCALE } from "@/lib/nox/contract";

type ScoredCriterion = {
  type: "SCALE" | "NUMERIC" | "BOOLEAN" | "RUBRIC" | "STAR" | "PASS_FAIL";
  weight: number;
  minScore: number;
  maxScore: number;
  value: string | number | boolean | null;
};

function normalizedCriterionValue(criterion: ScoredCriterion) {
  if (criterion.type === "BOOLEAN") {
    return criterion.value === true ? 1 : 0;
  }
  if (criterion.type === "PASS_FAIL") {
    return criterion.value === "PASS" ? 1 : 0;
  }
  if (criterion.type === "RUBRIC") {
    throw new Error(
      "Rubric text cannot be included in Nox numeric aggregation.",
    );
  }

  const value = Number(criterion.value);
  const range = criterion.maxScore - criterion.minScore;
  if (!Number.isFinite(value) || range <= 0) {
    throw new Error("Evaluation criterion score is invalid.");
  }
  return Math.min(1, Math.max(0, (value - criterion.minScore) / range));
}

export function computeNoxWeightedScore(criteria: ScoredCriterion[]) {
  if (criteria.some((criterion) => criterion.type === "RUBRIC")) {
    throw new Error(
      "Rubric criteria are not supported by Nox numeric aggregation.",
    );
  }
  const numericCriteria = criteria;
  const totalWeight = numericCriteria.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );
  if (!numericCriteria.length || totalWeight <= 0) {
    throw new Error("At least one weighted numeric criterion is required.");
  }

  const normalized = numericCriteria.reduce(
    (sum, criterion) =>
      sum + normalizedCriterionValue(criterion) * criterion.weight,
    0,
  );
  return BigInt(Math.round((normalized / totalWeight) * NOX_SCORE_SCALE));
}
