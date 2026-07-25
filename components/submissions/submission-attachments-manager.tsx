"use client";

import {
  Download,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { DownloadableAttachment } from "@/lib/submission-attachments";
import {
  SUBMISSION_ATTACHMENT_MAX_BYTES,
  SUBMISSION_ATTACHMENT_MAX_FILES,
} from "@/utils/submission-attachment";

type SubmissionAttachmentsManagerProps = {
  organizationId: string;
  campaignId: string;
  submissionId: string;
  attachments: DownloadableAttachment[];
  canManage: boolean;
  mutable: boolean;
};

function formatBytes(value: string) {
  const bytes = Number(value);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) {
    return <FileImage aria-hidden="true" size={17} />;
  }
  if (mimeType.includes("zip")) {
    return <FileArchive aria-hidden="true" size={17} />;
  }
  return <FileText aria-hidden="true" size={17} />;
}

export function SubmissionAttachmentsManager({
  organizationId,
  campaignId,
  submissionId,
  attachments,
  canManage,
  mutable,
}: SubmissionAttachmentsManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [confirmAttachment, setConfirmAttachment] =
    useState<DownloadableAttachment | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const uploadEnabled =
    canManage && mutable && attachments.length < SUBMISSION_ATTACHMENT_MAX_FILES;

  async function uploadFiles(files: File[]) {
    if (!uploadEnabled || files.length === 0) return;

    setPending("upload");
    setMessage(null);
    let uploaded = 0;

    for (const file of files) {
      if (file.size > SUBMISSION_ATTACHMENT_MAX_BYTES) {
        setMessage(`${file.name} exceeds the 25 MB limit.`);
        continue;
      }

      const body = new FormData();
      body.set("attachment", file);
      const response = await fetch(
        `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/attachments`,
        { method: "POST", body },
      );
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? `${file.name} could not be uploaded.`);
        continue;
      }
      uploaded += 1;
    }

    setPending(null);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded > 0) {
      setMessage(
        uploaded === 1
          ? "Attachment uploaded."
          : `${uploaded} attachments uploaded.`,
      );
      router.refresh();
    }
  }

  async function removeAttachment(attachmentId: string) {
    setPending(attachmentId);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/attachments/${attachmentId}`,
      { method: "DELETE" },
    );
    const result = (await response.json()) as { error?: string };

    setPending(null);
    if (!response.ok) {
      setMessage(result.error ?? "Attachment could not be removed.");
      setConfirmAttachment(null);
      return;
    }

    setMessage("Attachment removed.");
    setConfirmAttachment(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[12px] font-bold tracking-[0.1em] text-zinc-950 uppercase dark:text-white">
            <Paperclip aria-hidden="true" size={14} />
            Submission attachments
          </p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">
            {attachments.length} / {SUBMISSION_ATTACHMENT_MAX_FILES} files
          </p>
        </div>
        {canManage ? (
          <label
            className={
              uploadEnabled && pending === null
                ? "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-black/[0.08] px-4 text-[10px] font-bold tracking-[0.08em] uppercase transition-colors hover:border-indigo-500 hover:text-indigo-500 dark:border-white/[0.08]"
                : "inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 border border-black/[0.08] px-4 text-[10px] font-bold tracking-[0.08em] text-zinc-400 uppercase opacity-60 dark:border-white/[0.08]"
            }
          >
            {pending === "upload" ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={13} />
            ) : (
              <Upload aria-hidden="true" size={13} />
            )}
            Upload files
            <input
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
              className="sr-only"
              disabled={!uploadEnabled || pending !== null}
              multiple
              onChange={(event) => {
                void uploadFiles(Array.from(event.target.files ?? []));
              }}
              ref={inputRef}
              type="file"
            />
          </label>
        ) : null}
      </div>

      {canManage && !mutable ? (
        <p className="mt-5 border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-[11px] leading-5 text-amber-600 dark:text-amber-400">
          Attachments are locked because campaign evaluation has started.
        </p>
      ) : null}

      {attachments.length ? (
        <div className="mt-6 divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.06] dark:border-white/[0.06]">
          {attachments.map((attachment) => (
            <article
              className="flex min-w-0 items-center gap-4 py-4"
              key={attachment.id}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-black/[0.07] text-zinc-500 dark:border-white/[0.07]">
                <AttachmentIcon mimeType={attachment.mimeType} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-zinc-950 dark:text-white">
                  {attachment.fileName}
                </p>
                <p className="mt-1 text-[9px] text-zinc-500 uppercase">
                  {formatBytes(attachment.sizeBytes)} /{" "}
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                  }).format(new Date(attachment.createdAt))}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {attachment.downloadUrl ? (
                  <a
                    aria-label={`Download ${attachment.fileName}`}
                    className="flex h-9 w-9 items-center justify-center border border-black/[0.08] text-zinc-500 transition-colors hover:border-indigo-500 hover:text-indigo-500 dark:border-white/[0.08]"
                    href={attachment.downloadUrl}
                  >
                    <Download aria-hidden="true" size={13} />
                  </a>
                ) : (
                  <span
                    aria-label="Download unavailable"
                    className="flex h-9 w-9 items-center justify-center border border-black/[0.08] text-zinc-300 dark:border-white/[0.08] dark:text-zinc-700"
                  >
                    <Download aria-hidden="true" size={13} />
                  </span>
                )}
                {canManage && mutable ? (
                  <button
                    aria-label={`Remove ${attachment.fileName}`}
                    className="flex h-9 w-9 items-center justify-center border border-rose-500/20 text-rose-500 disabled:opacity-50"
                    disabled={pending !== null}
                    onClick={() => setConfirmAttachment(attachment)}
                    type="button"
                  >
                    {pending === attachment.id ? (
                      <Loader2
                        aria-hidden="true"
                        className="animate-spin"
                        size={13}
                      />
                    ) : (
                      <Trash2 aria-hidden="true" size={13} />
                    )}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <button
          className="mt-6 flex min-h-44 w-full flex-col items-center justify-center border border-dashed border-black/[0.1] text-zinc-500 disabled:cursor-default dark:border-white/[0.1]"
          disabled={!uploadEnabled || pending !== null}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Upload aria-hidden="true" size={20} />
          <span className="mt-4 text-[11px] font-bold tracking-[0.1em] uppercase">
            No attachments
          </span>
          <span className="mt-2 text-[10px]">
            PDF, images, Office files, text, CSV, or ZIP up to 25 MB
          </span>
        </button>
      )}

      {message ? (
        <p
          className={
            message.endsWith("uploaded.") || message === "Attachment removed."
              ? "mt-4 text-[11px] text-emerald-500"
              : "mt-4 text-[11px] text-rose-500"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
      <ConfirmationDialog
        confirmLabel="Remove attachment"
        description={
          confirmAttachment
            ? `${confirmAttachment.fileName} will be permanently removed from this submission and its private storage bucket.`
            : ""
        }
        isPending={pending === confirmAttachment?.id}
        onConfirm={() => {
          if (confirmAttachment) {
            void removeAttachment(confirmAttachment.id);
          }
        }}
        onOpenChange={(open) => {
          if (!open) setConfirmAttachment(null);
        }}
        open={confirmAttachment !== null}
        title="Are you sure you want to remove this attachment?"
        tone="danger"
      />
    </div>
  );
}
