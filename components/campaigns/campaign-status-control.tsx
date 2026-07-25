"use client";

import { Archive, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  campaignStatusLabels,
  campaignStatusTransitions,
  type CampaignStatus,
} from "@/constants/campaign";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type CampaignStatusControlProps = {
  organizationId: string;
  campaignId: string;
  currentStatus: CampaignStatus;
};

export function CampaignStatusControl({
  organizationId,
  campaignId,
  currentStatus,
}: CampaignStatusControlProps) {
  const router = useRouter();
  const options = campaignStatusTransitions[currentStatus];
  const [status, setStatus] = useState<CampaignStatus>(
    options[0] ?? currentStatus,
  );
  const [isPending, setIsPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(nextStatus: CampaignStatus) {
    setIsPending(true);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/status`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      },
    );
    const result = (await response.json()) as { error?: string };
    setIsPending(false);

    if (!response.ok) {
      setMessage(result.error ?? "Campaign status could not be updated.");
      setConfirmOpen(false);
      return;
    }

    setMessage(`Campaign moved to ${campaignStatusLabels[nextStatus]}.`);
    setConfirmOpen(false);
    router.refresh();
  }

  return (
    <div>
      <p className="text-[12px] font-bold text-zinc-950 uppercase dark:text-white">
        Campaign status
      </p>
      <p className="mt-2 text-[11px] leading-5 text-zinc-500">
        Status changes are recorded in the campaign timeline.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <select
          className="h-11 min-w-0 flex-1 border border-black/[0.08] bg-[#EBE8E1] px-3 text-[11px] font-bold outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#111]"
          disabled={isPending}
          onChange={(event) =>
            setStatus(event.target.value as CampaignStatus)
          }
          value={status}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {campaignStatusLabels[option]}
            </option>
          ))}
        </select>
        <button
          className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[10px] font-bold tracking-[0.1em] uppercase disabled:opacity-50 dark:bg-white"
          disabled={isPending || !options.length}
          onClick={() => setConfirmOpen(true)}
          type="button"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : status === "ARCHIVED" ? (
            <Archive aria-hidden="true" size={14} />
          ) : (
            <RefreshCw aria-hidden="true" size={14} />
          )}
          Update status
        </button>
      </div>
      {message ? (
        <p
          className={
            message.startsWith("Campaign moved")
              ? "mt-3 text-[11px] text-emerald-500"
              : "mt-3 text-[11px] text-rose-500"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
      <ConfirmationDialog
        confirmLabel="Update campaign status"
        description={`This will move the campaign from ${campaignStatusLabels[currentStatus]} to ${campaignStatusLabels[status]}. The transition is recorded in the audit timeline and can affect submissions and evaluations.`}
        isPending={isPending}
        onConfirm={() => void updateStatus(status)}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Are you sure you want to change the campaign status?"
        tone={status === "ARCHIVED" ? "danger" : "default"}
      />
    </div>
  );
}
