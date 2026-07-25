"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-2xl border-y border-rose-500/20 py-10">
      <AlertTriangle
        aria-hidden="true"
        className="text-rose-500"
        size={22}
      />
      <h1 className="mt-6 text-2xl font-bold text-zinc-950 uppercase dark:text-white">
        Workspace request failed
      </h1>
      <p className="mt-4 text-[10px] leading-6 text-zinc-500">
        Conclave could not complete this request. No confidential evaluation
        data was changed.
      </p>
      <button
        className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-sm border border-black/[0.08] px-5 py-3 text-[9px] font-bold tracking-[0.1em] uppercase dark:border-white/[0.08]"
        onClick={reset}
        type="button"
      >
        <RotateCcw aria-hidden="true" size={14} />
        Try again
      </button>
    </div>
  );
}
