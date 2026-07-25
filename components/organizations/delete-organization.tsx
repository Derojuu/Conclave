"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteOrganizationProps = {
  organizationId: string;
  organizationSlug: string;
};

export function DeleteOrganization({
  organizationId,
  organizationSlug,
}: DeleteOrganizationProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeOrganization() {
    setIsPending(true);
    setError(null);
    const response = await fetch(`/api/organizations/${organizationId}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Organization deletion failed.");
      setIsPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <p className="text-[10px] font-bold text-rose-500 uppercase">
        Delete organization
      </p>
      <p className="mt-2 max-w-2xl text-[9px] leading-5 text-zinc-500">
        This permanently removes campaigns, submissions, evaluations,
        invitations, memberships, and organization settings.
      </p>
      <label
        className="mt-5 block text-[8px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
        htmlFor="delete-confirmation"
      >
        Enter {organizationSlug} to confirm
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          autoComplete="off"
          className="h-11 min-w-0 flex-1 border border-rose-500/20 bg-rose-500/[0.02] px-3 text-[10px] outline-none focus:border-rose-500"
          id="delete-confirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          value={confirmation}
        />
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-rose-600 px-5 text-[8px] font-bold tracking-[0.1em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-40"
          disabled={confirmation !== organizationSlug || isPending}
          onClick={removeOrganization}
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
      {error ? (
        <p className="mt-3 text-[9px] text-rose-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
