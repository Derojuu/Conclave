export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "OPEN",
  "EVALUATING",
  "COMPUTING",
  "COMPLETED",
  "ARCHIVED",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  EVALUATING: "Evaluating",
  COMPUTING: "Computing",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const campaignStatusTransitions: Record<
  CampaignStatus,
  readonly CampaignStatus[]
> = {
  DRAFT: ["OPEN", "ARCHIVED"],
  OPEN: ["DRAFT", "EVALUATING"],
  EVALUATING: [],
  COMPUTING: [],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionCampaignStatus(
  current: CampaignStatus,
  next: CampaignStatus,
) {
  return campaignStatusTransitions[current].includes(next);
}
