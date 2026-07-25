"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setIsPending(true);
    setError(null);
    const response = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      organizationId?: string;
    };

    if (!response.ok || !result.organizationId) {
      setError(result.error ?? "Invitation acceptance failed.");
      setIsPending(false);
      return;
    }

    router.push(`/organizations/${result.organizationId}`);
    router.refresh();
  }

  return (
    <div>
      <Button
        className="button-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-zinc-950 px-5 py-3 text-[11px] font-bold tracking-[0.1em] uppercase disabled:opacity-60 dark:bg-white"
        disabled={isPending}
        onClick={accept}
        type="button"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={14} />
        ) : (
          <Check aria-hidden="true" size={14} />
        )}
        Accept invitation
      </Button>
      {error ? (
        <p className="mt-4 text-[11px] text-rose-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
