export const EVALUATION_SCORE_TYPES = ["NUMERIC", "STAR", "PASS_FAIL"] as const;

export type EvaluationScoreType = (typeof EVALUATION_SCORE_TYPES)[number];

export const evaluationScoreTypeLabels: Record<EvaluationScoreType, string> = {
  NUMERIC: "Numeric",
  STAR: "Star",
  PASS_FAIL: "Pass / fail",
};

export const evaluationScoreTypeDefaults: Record<
  EvaluationScoreType,
  { minScore: number; maxScore: number }
> = {
  NUMERIC: { minScore: 0, maxScore: 10 },
  STAR: { minScore: 1, maxScore: 5 },
  PASS_FAIL: { minScore: 0, maxScore: 1 },
};
