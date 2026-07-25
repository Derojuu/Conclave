"use client";

import { Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type OrganizationSidebarLinkProps = {
  active: boolean;
  organization: {
    id: string;
    name: string;
    role: "OWNER" | "ADMIN" | "EVALUATOR" | "OBSERVER";
  };
};

export function OrganizationSidebarLink({
  active,
  organization,
}: OrganizationSidebarLinkProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function activate() {
    setIsPending(true);
    const response = await fetch("/api/account/active-organization", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId: organization.id }),
    });

    if (!response.ok) {
      setIsPending(false);
      return;
    }

    router.push(`/organizations/${organization.id}`);
    router.refresh();
  }

  return (
    <button
      className={
        active
          ? "flex w-full items-center justify-between gap-3 rounded-sm bg-indigo-500/[0.06] px-2 py-3 text-left text-[11px] text-indigo-500"
          : "flex w-full items-center justify-between gap-3 rounded-sm px-2 py-3 text-left text-[11px] text-zinc-600 transition-colors hover:bg-black/[0.04] hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
      }
      disabled={isPending}
      onClick={activate}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-3">
        {isPending ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={14} />
        ) : (
          <Building2 aria-hidden="true" size={14} />
        )}
        <span className="truncate">{organization.name}</span>
      </span>
      <span className="text-[9px] text-zinc-500">
        {organization.role}
      </span>
    </button>
  );
}
