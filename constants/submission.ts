export const SUBMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "SHORTLISTED",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
  "ARCHIVED",
] as const;

export const SUBMISSION_LINK_TYPES = [
  "WEBSITE",
  "PORTFOLIO",
  "RESUME",
  "GITHUB",
  "DEMO",
  "VIDEO",
  "PITCH_DECK",
  "DOCUMENT",
  "OTHER",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
export type SubmissionLinkType = (typeof SUBMISSION_LINK_TYPES)[number];

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  SHORTLISTED: "Shortlisted",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ARCHIVED: "Archived",
};

export const submissionLinkTypeLabels: Record<SubmissionLinkType, string> = {
  WEBSITE: "Website",
  PORTFOLIO: "Portfolio",
  RESUME: "Resume",
  GITHUB: "GitHub",
  DEMO: "Demo",
  VIDEO: "Video",
  PITCH_DECK: "Pitch deck",
  DOCUMENT: "Document",
  OTHER: "Other",
};

export const submissionStatusTransitions: Record<
  SubmissionStatus,
  readonly SubmissionStatus[]
> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN", "ARCHIVED"],
  SUBMITTED: ["DRAFT", "IN_REVIEW", "REJECTED", "WITHDRAWN", "ARCHIVED"],
  IN_REVIEW: ["SUBMITTED", "SHORTLISTED", "REJECTED", "ARCHIVED"],
  SHORTLISTED: ["IN_REVIEW", "REJECTED", "ARCHIVED"],
  SELECTED: [],
  REJECTED: ["IN_REVIEW", "ARCHIVED"],
  WITHDRAWN: ["DRAFT", "ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionSubmissionStatus(
  current: SubmissionStatus,
  next: SubmissionStatus,
) {
  return submissionStatusTransitions[current].includes(next);
}
