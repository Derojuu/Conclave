import {
  submissionStatusLabels,
  type SubmissionStatus,
} from "@/constants/submission";

const statusClasses: Record<SubmissionStatus, string> = {
  DRAFT: "border-zinc-500/20 text-zinc-500",
  SUBMITTED: "border-sky-500/20 bg-sky-500/[0.04] text-sky-500",
  IN_REVIEW:
    "border-amber-500/20 bg-amber-500/[0.04] text-amber-500",
  SHORTLISTED:
    "border-indigo-500/20 bg-indigo-500/[0.04] text-indigo-500",
  SELECTED:
    "border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-500",
  REJECTED: "border-rose-500/20 bg-rose-500/[0.04] text-rose-500",
  WITHDRAWN: "border-zinc-500/20 bg-zinc-500/[0.04] text-zinc-500",
  ARCHIVED: "border-zinc-500/20 bg-zinc-500/[0.04] text-zinc-500",
};

export function SubmissionStatusBadge({
  status,
}: {
  status: SubmissionStatus;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center border px-2.5 py-1.5 text-[10px] font-bold tracking-[0.08em] uppercase ${statusClasses[status]}`}
    >
      {submissionStatusLabels[status]}
    </span>
  );
}
