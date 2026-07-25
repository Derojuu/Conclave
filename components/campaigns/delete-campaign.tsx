"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type DeleteCampaignProps = {
  organizationId: string;
  campaignId: string;
  campaignTitle: string;
  canDelete: boolean;
};

export function DeleteCampaign({
  organizationId,
  campaignId,
  campaignTitle,
  canDelete,
}: DeleteCampaignProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeCampaign() {
    setIsPending(true);
    setError(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation }),
      },
    );
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Campaign deletion failed.");
      setIsPending(false);
      setConfirmOpen(false);
      return;
    }

    router.push(`/organizations/${organizationId}/campaigns`);
    router.refresh();
  }

  return (
    <div>
      <p className="text-[12px] font-bold text-rose-500 uppercase">
        Delete campaign
      </p>
      <p className="mt-2 text-[11px] leading-5 text-zinc-500">
        Only draft or archived campaigns can be deleted. This also removes
        submissions, evaluations, assignments, and results.
      </p>
      <label
        className="mt-5 block text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
        htmlFor="campaign-delete-confirmation"
      >
        Enter the full campaign title to confirm
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          className="h-11 min-w-0 flex-1 border border-rose-500/20 bg-rose-500/[0.02] px-3 text-[12px] outline-none focus:border-rose-500"
          disabled={!canDelete}
          id="campaign-delete-confirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          value={confirmation}
        />
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-rose-600 px-5 text-[10px] font-bold tracking-[0.1em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-40"
          disabled={
            !canDelete ||
            confirmation !== campaignTitle ||
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
          Archive this campaign before deleting it.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-[11px] text-rose-500" role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmationDialog
        confirmLabel="Delete campaign"
        description="This permanently deletes the campaign, its submissions, evaluator assignments, encrypted evaluations, computation records, and results. This cannot be undone."
        isPending={isPending}
        onConfirm={() => void removeCampaign()}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Are you sure you want to delete this campaign?"
        tone="danger"
      />
    </div>
  );
}
