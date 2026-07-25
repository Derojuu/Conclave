"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type DeleteSubmissionProps = {
  organizationId: string;
  campaignId: string;
  submissionId: string;
  submissionTitle: string;
  canDelete: boolean;
};

export function DeleteSubmission({
  organizationId,
  campaignId,
  submissionId,
  submissionTitle,
  canDelete,
}: DeleteSubmissionProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeSubmission() {
    setIsPending(true);
    setError(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation }),
      },
    );
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Submission deletion failed.");
      setIsPending(false);
      setConfirmOpen(false);
      return;
    }

    router.push(
      `/organizations/${organizationId}/campaigns/${campaignId}/submissions`,
    );
    router.refresh();
  }

  return (
    <div>
      <p className="text-[12px] font-bold text-rose-500 uppercase">
        Delete submission
      </p>
      <p className="mt-2 text-[11px] leading-5 text-zinc-500">
        Only draft or archived submissions can be deleted while campaign
        submissions remain editable.
      </p>
      <label
        className="mt-5 block text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
        htmlFor="submission-delete-confirmation"
      >
        Enter the full submission title to confirm
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          className="h-11 min-w-0 flex-1 border border-rose-500/20 bg-rose-500/[0.02] px-3 text-[12px] outline-none focus:border-rose-500"
          disabled={!canDelete}
          id="submission-delete-confirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          value={confirmation}
        />
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-rose-600 px-5 text-[10px] font-bold tracking-[0.1em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-40"
          disabled={
            !canDelete ||
            confirmation !== submissionTitle ||
            isPending
          }
          onClick={() => setConfirmOpen(true)}
          type="button"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : (
            <Trash2 aria-hidden="true" size={14} />
          )}
          Delete permanently
        </button>
      </div>
      {!canDelete ? (
        <p className="mt-3 text-[11px] text-amber-500">
          Archive the submission and ensure the campaign is Draft or Open before
          deletion.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-[11px] text-rose-500" role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmationDialog
        confirmLabel="Delete submission"
        description="This permanently deletes the submission, its links, attachments, contributors, encrypted evaluations, and result references. This cannot be undone."
        isPending={isPending}
        onConfirm={() => void removeSubmission()}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Are you sure you want to delete this submission?"
        tone="danger"
      />
    </div>
  );
}
