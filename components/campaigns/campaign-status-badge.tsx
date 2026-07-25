import {
  campaignStatusLabels,
  type CampaignStatus,
} from "@/constants/campaign";

const statusClasses: Record<CampaignStatus, string> = {
  DRAFT: "border-zinc-500/20 text-zinc-500",
  OPEN: "border-sky-500/20 bg-sky-500/[0.04] text-sky-500",
  EVALUATING:
    "border-amber-500/20 bg-amber-500/[0.04] text-amber-500",
  COMPUTING:
    "border-violet-500/20 bg-violet-500/[0.04] text-violet-500",
  COMPLETED:
    "border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-500",
  ARCHIVED: "border-zinc-500/20 bg-zinc-500/[0.04] text-zinc-500",
};

export function CampaignStatusBadge({
  status,
}: {
  status: CampaignStatus;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center border px-2.5 py-1.5 text-[8px] font-bold tracking-[0.08em] uppercase ${statusClasses[status]}`}
    >
      {campaignStatusLabels[status]}
    </span>
  );
}
