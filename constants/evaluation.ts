export const EVALUATION_RECOMMENDATIONS = [
  "STRONGLY_RECOMMEND",
  "RECOMMEND",
  "NEUTRAL",
  "DO_NOT_RECOMMEND",
  "STRONGLY_DO_NOT_RECOMMEND",
] as const;

export type EvaluationRecommendation =
  (typeof EVALUATION_RECOMMENDATIONS)[number];

export const evaluationRecommendationLabels: Record<
  EvaluationRecommendation,
  string
> = {
  STRONGLY_RECOMMEND: "Strongly recommend",
  RECOMMEND: "Recommend",
  NEUTRAL: "Neutral",
  DO_NOT_RECOMMEND: "Do not recommend",
  STRONGLY_DO_NOT_RECOMMEND: "Strongly do not recommend",
};

export const EVALUATION_ENCRYPTION_ALGORITHM =
  "RSA-OAEP-256+A256GCM" as const;
export const EVALUATION_PAYLOAD_SCHEMA_VERSION = 1 as const;
