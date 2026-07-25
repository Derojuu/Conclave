import { Building2, KeyRound, ShieldCheck } from "lucide-react";

import type { AuthorizationContext } from "@/lib/security/rbac";

type MembershipPanelProps = {
  authorization: AuthorizationContext;
};

function formatPermission(permission: string) {
  return permission
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function MembershipPanel({
  authorization,
}: MembershipPanelProps) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <Building2
          aria-hidden="true"
          className="mt-0.5 text-indigo-500"
          size={16}
        />
        <div>
          <p className="text-[12px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
            Organization membership
          </p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">
            Roles and permissions are assigned independently in each
            organization.
          </p>
        </div>
      </div>

      {authorization.organizations.length ? (
        <div className="mt-6 divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.06] dark:border-white/[0.06]">
          {authorization.organizations.map((organization) => (
            <div className="py-5" key={organization.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-bold text-zinc-950 dark:text-white">
                    {organization.name}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    /{organization.slug}
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.04] px-2.5 py-1.5 text-[10px] font-bold tracking-[0.08em] text-emerald-500 uppercase">
                  <ShieldCheck aria-hidden="true" size={12} />
                  {organization.role}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {organization.permissions.map((permission) => (
                  <span
                    className="inline-flex items-center gap-1.5 border border-black/[0.06] px-2 py-1 text-[9px] text-zinc-500 dark:border-white/[0.06]"
                    key={permission}
                  >
                    <KeyRound aria-hidden="true" size={9} />
                    {formatPermission(permission)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 border-y border-black/[0.06] py-5 text-[11px] text-zinc-500 dark:border-white/[0.06]">
          You are not currently a member of an organization.
        </p>
      )}
    </div>
  );
}
