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

type Candidate = Person & {
  role: "OWNER" | "ADMIN" | "EVALUATOR" | "OBSERVER";
};

type TeamMember = Person & {
  joinedAt: string;
  addedBy: string | null;
};

type SubmissionContributorsManagerProps = {
  organizationId: string;
  campaignId: string;
  submissionId: string;
  members: TeamMember[];
  candidates: Candidate[];
  canManage: boolean;
  mutable: boolean;
};

export function SubmissionContributorsManager({
  organizationId,
  campaignId,
  submissionId,
  members,
  candidates,
  canManage,
  mutable,
}: SubmissionContributorsManagerProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState(candidates[0]?.id ?? "");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [confirmMember, setConfirmMember] = useState<TeamMember | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const activeUserId = candidates.some(
    (candidate) => candidate.id === selectedUserId,
  )
    ? selectedUserId
    : (candidates[0]?.id ?? "");

  async function addMember() {
    if (!activeUserId) {
      return;
    }

    setPendingUserId(activeUserId);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/contributors`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: activeUserId }),
      },
    );
    const result = (await response.json()) as { error?: string };
    setPendingUserId(null);

    if (!response.ok) {
      setMessage(result.error ?? "Contributor assignment failed.");
      return;
    }

    setMessage("Contributor added.");
    router.refresh();
  }

  async function removeMember(userId: string) {
    setPendingUserId(userId);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/contributors/${userId}`,
      { method: "DELETE" },
    );
    const result = (await response.json()) as { error?: string };
    setPendingUserId(null);

    if (!response.ok) {
      setMessage(result.error ?? "Contributor removal failed.");
      setConfirmMember(null);
      return;
    }

    setMessage("Contributor removed.");
    setConfirmMember(null);
    router.refresh();
  }

  return (
    <div>
      {canManage ? (
        <div className="flex flex-col gap-3 border-b border-black/[0.06] pb-7 sm:flex-row dark:border-white/[0.06]">
          <div className="min-w-0 flex-1">
            <label
              className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
              htmlFor="submission-contributor-candidate"
            >
              Assign organization member
            </label>
            <select
              className="mt-2 h-11 w-full border border-black/[0.08] bg-[#EBE8E1] px-3 text-[12px] outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#111]"
              disabled={
                !mutable || !candidates.length || pendingUserId !== null
              }
              id="submission-contributor-candidate"
              onChange={(event) => setSelectedUserId(event.target.value)}
              value={activeUserId}
            >
              {candidates.length ? (
                candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.fullName} / {candidate.role}
                  </option>
                ))
              ) : (
                <option value="">No unassigned members available</option>
              )}
            </select>
          </div>
          <button
            className="button-primary mt-5 inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[10px] font-bold tracking-[0.1em] uppercase disabled:opacity-50 dark:bg-white"
            disabled={!mutable || !activeUserId || pendingUserId !== null}
            onClick={addMember}
            type="button"
          >
            {pendingUserId === activeUserId ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={14} />
            ) : (
              <UserPlus aria-hidden="true" size={14} />
            )}
            Add member
          </button>
        </div>
      ) : null}

      {!mutable && canManage ? (
        <p className="mt-4 text-[11px] text-amber-500">
          Contributor assignments are locked because evaluation has started.
        </p>
      ) : null}
      {message ? (
        <p
          className={
            message === "Contributor added." ||
            message === "Contributor removed."
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
            Submission contributors
          </p>
          <span className="text-[10px] text-zinc-500">
            {members.length} MEMBERS
          </span>
        </div>
        {members.length ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {members.map((member) => (
              <div
                className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                key={member.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-indigo-500/10 text-[10px] font-bold text-indigo-500">
                    {member.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={member.avatar}
                      />
                    ) : (
                      member.fullName.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-zinc-950 dark:text-white">
                      {member.fullName}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-zinc-500">
                      {member.email}
                    </p>
                    <p className="mt-1 text-[9px] text-zinc-500">
                      ADDED{" "}
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                      }).format(new Date(member.joinedAt))}
                      {member.addedBy
                        ? ` BY ${member.addedBy.toUpperCase()}`
                        : ""}
                    </p>
                  </div>
                </div>
                {canManage ? (
                  <button
                    className="inline-flex min-h-9 w-fit items-center justify-center gap-2 border border-rose-500/20 px-3 text-[10px] font-bold text-rose-500 uppercase disabled:opacity-50"
                    disabled={!mutable || pendingUserId === member.id}
                    onClick={() => setConfirmMember(member)}
                    type="button"
                  >
                    {pendingUserId === member.id ? (
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
            No organization members are assigned to this submission.
          </p>
        )}
      </div>
      <ConfirmationDialog
        confirmLabel="Remove contributor"
        description={
          confirmMember
            ? `${confirmMember.fullName} will be removed from this submission's contributor list.`
            : ""
        }
        isPending={pendingUserId === confirmMember?.id}
        onConfirm={() => {
          if (confirmMember) void removeMember(confirmMember.id);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirmMember(null);
        }}
        open={confirmMember !== null}
        title="Are you sure you want to remove this contributor?"
        tone="danger"
      />
    </div>
  );
}
