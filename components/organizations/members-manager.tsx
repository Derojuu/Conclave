"use client";

import { Copy, Loader2, MailPlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  invitationSchema,
  type InvitationInput,
} from "@/lib/validation/auth";

type Member = {
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  role: "OWNER" | "ADMIN" | "EVALUATOR" | "OBSERVER";
};

type Invitation = {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "EVALUATOR" | "OBSERVER";
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
};

type MembersManagerProps = {
  organizationId: string;
  currentUserId: string;
  canManage: boolean;
  members: Member[];
  invitations: Invitation[];
};

export function MembersManager({
  organizationId,
  currentUserId,
  canManage,
  members,
  invitations,
}: MembersManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [pendingMember, setPendingMember] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvitationInput>({
    defaultValues: { email: "", role: "EVALUATOR" },
  });

  const invite = handleSubmit(async (values) => {
    setMessage(null);
    setInviteUrl(null);
    const parsed = invitationSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "email" || field === "role") {
          setError(field, { message: issue.message });
        }
      });
      return;
    }

    const response = await fetch(
      `/api/organizations/${organizationId}/invitations`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      },
    );
    const result = (await response.json()) as {
      error?: string;
      invitationUrl?: string;
    };

    if (!response.ok || !result.invitationUrl) {
      setMessage(result.error ?? "Invitation creation failed.");
      return;
    }

    setInviteUrl(result.invitationUrl);
    setMessage("Invitation created.");
    reset();
    router.refresh();
  });

  async function updateMember(
    userId: string,
    role: "ADMIN" | "EVALUATOR" | "OBSERVER",
  ) {
    setPendingMember(userId);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/members/${userId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      },
    );
    const result = (await response.json()) as { error?: string };
    setPendingMember(null);

    if (!response.ok) {
      setMessage(result.error ?? "Role update failed.");
      return;
    }

    router.refresh();
  }

  async function removeMember(userId: string) {
    setPendingMember(userId);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/members/${userId}`,
      { method: "DELETE" },
    );
    const result = (await response.json()) as { error?: string };
    setPendingMember(null);

    if (!response.ok) {
      setMessage(result.error ?? "Member removal failed.");
      return;
    }

    router.refresh();
  }

  async function revokeInvitation(invitationId: string) {
    const response = await fetch(
      `/api/organizations/${organizationId}/invitations/${invitationId}`,
      { method: "DELETE" },
    );
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(result.error ?? "Invitation revocation failed.");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      {canManage ? (
        <form
          className="grid gap-4 border-b border-black/[0.06] pb-8 sm:grid-cols-[1fr_150px_auto] dark:border-white/[0.06]"
          onSubmit={invite}
        >
          <div>
            <label
              className="text-[8px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
              htmlFor="invite-email"
            >
              Invite by email
            </label>
            <input
              className="mt-2 h-11 w-full rounded-sm border border-black/[0.08] bg-black/[0.02] px-3 text-[11px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
              id="invite-email"
              placeholder="evaluator@example.com"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-2 text-[9px] text-rose-500">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div>
            <label
              className="text-[8px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
              htmlFor="invite-role"
            >
              Role
            </label>
            <select
              className="mt-2 h-11 w-full rounded-sm border border-black/[0.08] bg-[#EBE8E1] px-3 text-[10px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#111]"
              id="invite-role"
              {...register("role")}
            >
              <option value="EVALUATOR">Evaluator</option>
              <option value="OBSERVER">Observer</option>
              <option value="ADMIN">Organization admin</option>
            </select>
          </div>
          <button
            className="button-primary mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-zinc-950 px-5 text-[9px] font-bold tracking-[0.1em] uppercase disabled:opacity-60 dark:bg-white"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={14} />
            ) : (
              <MailPlus aria-hidden="true" size={14} />
            )}
            Invite
          </button>
        </form>
      ) : null}

      {inviteUrl ? (
        <div className="mt-5 flex flex-col gap-3 border border-emerald-500/20 bg-emerald-500/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 break-all text-[9px] text-emerald-600 dark:text-emerald-400">
            {inviteUrl}
          </p>
          <button
            className="inline-flex shrink-0 items-center gap-2 text-[8px] font-bold tracking-[0.1em] text-emerald-600 uppercase dark:text-emerald-400"
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
            type="button"
          >
            <Copy aria-hidden="true" size={13} />
            Copy link
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 text-[9px] text-zinc-500" role="status">
          {message}
        </p>
      ) : null}

      <div className="mt-8">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
          <p className="text-[9px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
            Active members
          </p>
          <span className="text-[8px] text-zinc-500">
            {members.length} MEMBERS
          </span>
        </div>
        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
          {members.map((member) => {
            const mutable =
              canManage &&
              member.role !== "OWNER" &&
              member.userId !== currentUserId;

            return (
              <div
                className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                key={member.userId}
              >
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold text-zinc-950 uppercase dark:text-white">
                    {member.fullName}
                  </p>
                  <p className="mt-1 truncate text-[8px] text-zinc-500">
                    {member.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {mutable ? (
                    <select
                      aria-label={`Role for ${member.fullName}`}
                      className="h-9 rounded-sm border border-black/[0.08] bg-[#EBE8E1] px-3 text-[8px] font-bold dark:border-white/[0.08] dark:bg-[#111]"
                      defaultValue={member.role}
                      disabled={pendingMember === member.userId}
                      onChange={(event) =>
                        updateMember(
                          member.userId,
                          event.target.value as
                            | "ADMIN"
                            | "EVALUATOR"
                            | "OBSERVER",
                        )
                      }
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="EVALUATOR">EVALUATOR</option>
                      <option value="OBSERVER">OBSERVER</option>
                    </select>
                  ) : (
                    <span className="border border-black/[0.07] px-3 py-2 text-[8px] font-bold text-zinc-500 dark:border-white/[0.07]">
                      {member.role}
                    </span>
                  )}
                  {mutable ? (
                    <button
                      aria-label={`Remove ${member.fullName}`}
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-rose-500/20 text-rose-500"
                      disabled={pendingMember === member.userId}
                      onClick={() => removeMember(member.userId)}
                      type="button"
                    >
                      {pendingMember === member.userId ? (
                        <Loader2
                          aria-hidden="true"
                          className="animate-spin"
                          size={14}
                        />
                      ) : (
                        <Trash2 aria-hidden="true" size={14} />
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canManage && invitations.length ? (
        <div className="mt-10">
          <div className="border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
            <p className="text-[9px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
              Invitations
            </p>
          </div>
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {invitations.map((invitation) => (
              <div
                className="flex items-center justify-between gap-4 py-5"
                key={invitation.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-[10px] text-zinc-950 dark:text-white">
                    {invitation.email}
                  </p>
                  <p className="mt-1 text-[8px] text-zinc-500">
                    {invitation.role} / {invitation.status}
                  </p>
                </div>
                {invitation.status === "PENDING" ? (
                  <button
                    className="text-[8px] font-bold tracking-[0.1em] text-rose-500 uppercase"
                    onClick={() => revokeInvitation(invitation.id)}
                    type="button"
                  >
                    Revoke
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
