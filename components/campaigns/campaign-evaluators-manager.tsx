"use client";

import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type Person = {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
};

type AssignedEvaluator = Person & {
  assignedAt: string;
  assignedBy: string | null;
};

type CampaignEvaluatorsManagerProps = {
  organizationId: string;
  campaignId: string;
  evaluators: AssignedEvaluator[];
  candidates: Person[];
  canManage: boolean;
};

export function CampaignEvaluatorsManager({
  organizationId,
  campaignId,
  evaluators,
  candidates,
  canManage,
}: CampaignEvaluatorsManagerProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState(
    candidates[0]?.id ?? "",
  );
  const [pendingUserId, setPendingUserId] = useState<string | null>(
    null,
  );
  const [confirmEvaluator, setConfirmEvaluator] =
    useState<AssignedEvaluator | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function assignEvaluator() {
    if (!selectedUserId) {
      return;
    }

    setPendingUserId(selectedUserId);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/evaluators`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      },
    );
    const result = (await response.json()) as { error?: string };
    setPendingUserId(null);

    if (!response.ok) {
      setMessage(result.error ?? "Evaluator assignment failed.");
      return;
    }

    setMessage("Evaluator assigned.");
    router.refresh();
  }

  async function removeEvaluator(userId: string) {
    setPendingUserId(userId);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/evaluators/${userId}`,
      { method: "DELETE" },
    );
    const result = (await response.json()) as { error?: string };
    setPendingUserId(null);

    if (!response.ok) {
      setMessage(result.error ?? "Evaluator removal failed.");
      setConfirmEvaluator(null);
      return;
    }

    setMessage("Evaluator removed.");
    setConfirmEvaluator(null);
    router.refresh();
  }

  return (
    <div>
      {canManage ? (
        <div className="flex flex-col gap-3 border-b border-black/[0.06] pb-7 sm:flex-row dark:border-white/[0.06]">
          <div className="min-w-0 flex-1">
            <label
              className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
              htmlFor="evaluator-candidate"
            >
              Assign organization evaluator
            </label>
            <select
              className="mt-2 h-11 w-full border border-black/[0.08] bg-[#EBE8E1] px-3 text-[12px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#111]"
              disabled={!candidates.length || pendingUserId !== null}
              id="evaluator-candidate"
              onChange={(event) => setSelectedUserId(event.target.value)}
              value={selectedUserId}
            >
              {candidates.length ? (
                candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.fullName} / {candidate.email}
                  </option>
                ))
              ) : (
                <option value="">No unassigned evaluators available</option>
              )}
            </select>
          </div>
          <button
            className="button-primary mt-5 inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[10px] font-bold tracking-[0.1em] uppercase disabled:opacity-50 sm:mt-5 dark:bg-white"
            disabled={!selectedUserId || pendingUserId !== null}
            onClick={assignEvaluator}
            type="button"
          >
            {pendingUserId === selectedUserId ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={14} />
            ) : (
              <UserPlus aria-hidden="true" size={14} />
            )}
            Assign evaluator
          </button>
        </div>
      ) : null}

      {message ? (
        <p
          className={
            message === "Evaluator assigned." || message === "Evaluator removed."
              ? "mt-4 text-[11px] text-emerald-500"
              : "mt-4 text-[11px] text-rose-500"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="mt-7">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
          <p className="text-[11px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
            Assigned evaluators
          </p>
          <span className="text-[10px] text-zinc-500">
            {evaluators.length} EVALUATORS
          </span>
        </div>

        {evaluators.length ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {evaluators.map((evaluator) => (
              <div
                className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                key={evaluator.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-indigo-500/10 text-[10px] font-bold text-indigo-500">
                    {evaluator.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={evaluator.avatar}
                      />
                    ) : (
                      evaluator.fullName.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-zinc-950 dark:text-white">
                      {evaluator.fullName}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-zinc-500">
                      {evaluator.email}
                    </p>
                    <p className="mt-1 text-[9px] text-zinc-500">
                      ASSIGNED{" "}
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                      }).format(new Date(evaluator.assignedAt))}
                      {evaluator.assignedBy
                        ? ` BY ${evaluator.assignedBy.toUpperCase()}`
                        : ""}
                    </p>
                  </div>
                </div>
                {canManage ? (
                  <button
                    className="inline-flex min-h-9 w-fit items-center justify-center gap-2 border border-rose-500/20 px-3 text-[10px] font-bold text-rose-500 uppercase disabled:opacity-50"
                    disabled={pendingUserId === evaluator.id}
                    onClick={() => setConfirmEvaluator(evaluator)}
                    type="button"
                  >
                    {pendingUserId === evaluator.id ? (
                      <Loader2
                        aria-hidden="true"
                        className="animate-spin"
                        size={13}
                      />
                    ) : (
                      <UserMinus aria-hidden="true" size={13} />
                    )}
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="border-b border-black/[0.06] py-8 text-[12px] text-zinc-500 dark:border-white/[0.06]">
            No evaluators are assigned to this campaign.
          </p>
        )}
      </div>
      <ConfirmationDialog
        confirmLabel="Remove evaluator"
        description={
          confirmEvaluator
            ? `${confirmEvaluator.fullName} will lose access to this campaign's evaluation workspace. Existing submitted evaluation records are not deleted.`
            : ""
        }
        isPending={pendingUserId === confirmEvaluator?.id}
        onConfirm={() => {
          if (confirmEvaluator) void removeEvaluator(confirmEvaluator.id);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirmEvaluator(null);
        }}
        open={confirmEvaluator !== null}
        title="Are you sure you want to remove this evaluator?"
        tone="danger"
      />
    </div>
  );
}
