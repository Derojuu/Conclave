"use client";

import { Copy, GitBranchPlus, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type EvaluationTemplateActionsProps = {
  organizationId: string;
  templateId: string;
  templateTitle: string;
  version: number;
  canDelete: boolean;
};

type PendingAction = "duplicate" | "version" | "delete" | null;

export function EvaluationTemplateActions({
  organizationId,
  templateId,
  templateTitle,
  version,
  canDelete,
}: EvaluationTemplateActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const expectedConfirmation = `${templateTitle} v${version}`;

  async function createFrom(action: Exclude<PendingAction, "delete" | null>) {
    setPendingAction(action);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/evaluation-templates/${templateId}/${action === "duplicate" ? "duplicate" : "versions"}`,
        { method: "POST" },
      );
      const result = (await response.json()) as {
        error?: string;
        template?: { id: string };
      };

      if (!response.ok || !result.template) {
        setMessage(result.error ?? "Template action failed.");
        return;
      }

      router.push(
        `/organizations/${organizationId}/evaluation-templates/${result.template.id}`,
      );
      router.refresh();
    } catch {
      setMessage("The template service is currently unavailable.");
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteTemplate() {
    setPendingAction("delete");
    setMessage(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/evaluation-templates/${templateId}`,
        {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirmation }),
        },
      );
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? "Template deletion failed.");
        setConfirmOpen(false);
        return;
      }

      router.push(`/organizations/${organizationId}/evaluation-templates`);
      router.refresh();
    } catch {
      setMessage("The template service is currently unavailable.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="mt-10 border-y border-black/[0.06] py-7 dark:border-white/[0.06]">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-black/[0.08] px-4 text-[10px] font-bold tracking-[0.08em] uppercase hover:border-indigo-500 hover:text-indigo-500 disabled:opacity-50 dark:border-white/[0.08]"
          disabled={pendingAction !== null}
          onClick={() => createFrom("duplicate")}
          type="button"
        >
          {pendingAction === "duplicate" ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : (
            <Copy aria-hidden="true" size={14} />
          )}
          Duplicate template
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-black/[0.08] px-4 text-[10px] font-bold tracking-[0.08em] uppercase hover:border-indigo-500 hover:text-indigo-500 disabled:opacity-50 dark:border-white/[0.08]"
          disabled={pendingAction !== null}
          onClick={() => createFrom("version")}
          type="button"
        >
          {pendingAction === "version" ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : (
            <GitBranchPlus aria-hidden="true" size={14} />
          )}
          Create new version
        </button>
      </div>

      <div className="mt-8 border-t border-black/[0.06] pt-7 dark:border-white/[0.06]">
        <p className="text-[12px] font-bold text-rose-500 uppercase">
          Delete template version
        </p>
        <p className="mt-2 text-[11px] leading-5 text-zinc-500">
          Only versions that have never been assigned to a campaign can be
          deleted.
        </p>
        <label
          className="mt-5 block text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
          htmlFor="template-delete-confirmation"
        >
          Enter {expectedConfirmation} to confirm
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            className="h-11 min-w-0 flex-1 border border-rose-500/20 bg-rose-500/[0.02] px-3 text-[12px] outline-none focus:border-rose-500 disabled:opacity-50"
            disabled={!canDelete || pendingAction !== null}
            id="template-delete-confirmation"
            onChange={(event) => setConfirmation(event.target.value)}
            value={confirmation}
          />
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-rose-600 px-5 text-[10px] font-bold tracking-[0.1em] text-white uppercase disabled:opacity-40"
            disabled={
              !canDelete ||
              confirmation !== expectedConfirmation ||
              pendingAction !== null
            }
            onClick={() => setConfirmOpen(true)}
            type="button"
          >
            {pendingAction === "delete" ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={14} />
            ) : (
              <Trash2 aria-hidden="true" size={14} />
            )}
            Delete version
          </button>
        </div>
        {!canDelete ? (
          <p className="mt-3 text-[11px] text-amber-500">
            This version is assigned to a campaign and is immutable.
          </p>
        ) : null}
      </div>

      {message ? (
        <p className="mt-4 text-[11px] text-rose-500" role="alert">
          {message}
        </p>
      ) : null}
      <ConfirmationDialog
        confirmLabel="Delete template version"
        description="This permanently removes this unused evaluation template version. This action cannot be undone."
        isPending={pendingAction === "delete"}
        onConfirm={() => void deleteTemplate()}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Are you sure you want to delete this template version?"
        tone="danger"
      />
    </section>
  );
}
