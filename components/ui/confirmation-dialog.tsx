"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  isPending?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  isPending = false,
  onConfirm,
  onOpenChange,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto w-[min(30rem,calc(100vw-2rem))] overflow-hidden rounded-sm border border-black/[0.1] bg-[#F5F2EB] p-0 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/70 backdrop:backdrop-blur-sm dark:border-white/[0.1] dark:bg-[#111] dark:text-white"
      onCancel={(event) => {
        event.preventDefault();
        if (!isPending) onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onOpenChange(false);
        }
      }}
      onClose={() => {
        if (open && !isPending) onOpenChange(false);
      }}
      ref={dialogRef}
    >
      <div className="border-b border-black/[0.07] px-5 py-5 dark:border-white/[0.07] sm:px-6">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm",
              tone === "danger"
                ? "bg-rose-500/10 text-rose-500"
                : "bg-indigo-500/10 text-indigo-500",
            )}
          >
            <AlertTriangle aria-hidden="true" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold" id={titleId}>
              {title}
            </h2>
            <p
              className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400"
              id={descriptionId}
            >
              {description}
            </p>
          </div>
          <button
            aria-label="Close confirmation"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-950 disabled:opacity-40 dark:hover:text-white"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          className="inline-flex min-h-11 items-center justify-center border border-black/[0.09] px-5 text-xs font-bold tracking-[0.08em] uppercase transition-colors hover:bg-black/[0.04] disabled:opacity-40 dark:border-white/[0.09] dark:hover:bg-white/[0.05]"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
          type="button"
        >
          {cancelLabel}
        </button>
        <button
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 px-5 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors disabled:cursor-wait disabled:opacity-60",
            tone === "danger"
              ? "bg-rose-600 hover:bg-rose-500"
              : "bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
          )}
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={15} />
          ) : null}
          {isPending ? "Please wait..." : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
