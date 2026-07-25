"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SwitcherOrganization = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "EVALUATOR" | "OBSERVER";
};

type OrganizationSwitcherProps = {
  activeOrganizationId: string | null;
  organizations: SwitcherOrganization[];
};

export function OrganizationSwitcher({
  activeOrganizationId,
  organizations,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [value, setValue] = useState(activeOrganizationId ?? "");

  if (!organizations.length) {
    return null;
  }

  async function switchOrganization(organizationId: string) {
    setValue(organizationId);
    setIsPending(true);
    const response = await fetch("/api/account/active-organization", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });

    if (!response.ok) {
      setValue(activeOrganizationId ?? "");
      setIsPending(false);
      return;
    }

    router.push(`/organizations/${organizationId}`);
    router.refresh();
  }

  return (
    <div className="relative min-w-0">
      <label className="sr-only" htmlFor="organization-switcher">
        Active organization
      </label>
      <select
        className="h-9 w-[128px] truncate border border-black/[0.07] bg-transparent px-2 pr-7 text-[10px] font-bold text-zinc-600 outline-none focus:border-indigo-500 sm:w-[190px] dark:border-white/[0.07] dark:text-zinc-300"
        disabled={isPending}
        id="organization-switcher"
        onChange={(event) => void switchOrganization(event.target.value)}
        value={value}
      >
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name} / {organization.role}
          </option>
        ))}
      </select>
      {isPending ? (
        <Loader2
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 right-2 animate-spin text-zinc-500"
          size={12}
        />
      ) : null}
    </div>
  );
}
