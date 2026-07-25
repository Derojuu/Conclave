"use client";

import { Cpu, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type StartComputationButtonProps = {
  organizationId: string;
  campaignId: string;
  disabled?: boolean;
};

export function StartComputationButton({
  organizationId,
  campaignId,
  disabled = false,
}: StartComputationButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function start() {
    setIsPending(true);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/computations`,
      { method: "POST" },
    );
    const result = (await response.json()) as {
      error?: string;
      job?: { providerTaskId: string | null };
    };
    setIsPending(false);

    if (!response.ok || !result.job) {
      setMessage(result.error ?? "Confidential computation could not start.");
      return;
    }

    setMessage("Computation queued with iExec Nox.");
    router.refresh();
  }

  return (
    <div>
      <Button
        className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[8px] font-bold tracking-[0.1em] uppercase disabled:opacity-50 dark:bg-white"
        disabled={disabled || isPending}
        onClick={() => void start()}
        type="button"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={14} />
        ) : (
          <Cpu aria-hidden="true" size={14} />
        )}
        Start confidential computation
      </Button>
      {message ? (
        <p
          className={
            message.startsWith("Computation queued")
              ? "mt-3 text-[8px] text-emerald-500"
              : "mt-3 text-[8px] text-rose-500"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
