"use client";

import { Archive, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  submissionStatusLabels,
  submissionStatusTransitions,
  type SubmissionStatus,
} from "@/constants/submission";

type SubmissionStatusControlProps = {
  organizationId: string;
  campaignId: string;
  submissionId: string;
  currentStatus: SubmissionStatus;
  disabled?: boolean;
};

export function SubmissionStatusControl({
  organizationId,
  campaignId,
  submissionId,
  currentStatus,
  disabled = false,
}: SubmissionStatusControlProps) {
  const router = useRouter();
  const options = submissionStatusTransitions[currentStatus];
  const [status, setStatus] = useState<SubmissionStatus>(
    options[0] ?? currentStatus,
  );
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus() {
    setIsPending(true);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/status`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    const result = (await response.json()) as { error?: string };
    setIsPending(false);

    if (!response.ok) {
      setMessage(result.error ?? "Submission status could not be updated.");
      return;
    }

    setMessage(`Submission moved to ${submissionStatusLabels[status]}.`);
    router.refresh();
  }

  return (
    <div>
      <p className="text-[10px] font-bold text-zinc-950 uppercase dark:text-white">
        Submission status
      </p>
      <p className="mt-2 text-[9px] leading-5 text-zinc-500">
        Control the submission and review lifecycle before evaluation begins.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <select
          className="h-11 min-w-0 flex-1 border border-black/[0.08] bg-[#EBE8E1] px-3 text-[9px] font-bold outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#111]"
          disabled={disabled || isPending}
          onChange={(event) =>
            setStatus(event.target.value as SubmissionStatus)
          }
          value={status}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {submissionStatusLabels[option]}
            </option>
          ))}
        </select>
        <button
          className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[8px] font-bold tracking-[0.1em] uppercase disabled:opacity-50 dark:bg-white"
          disabled={disabled || isPending || !options.length}
          onClick={updateStatus}
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
            message.startsWith("Submission moved")
              ? "mt-3 text-[9px] text-emerald-500"
              : "mt-3 text-[9px] text-rose-500"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
