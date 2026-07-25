import { ArrowRight, Building2, Scale, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthorizationContext } from "@/lib/security/rbac";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const authorization = await getAuthorizationContext(user.id);
  const organizationIds = authorization.organizations.map(
    (organization) => organization.id,
  );
  const scope = authorization.isSuperAdmin
    ? undefined
    : { organizationId: { in: organizationIds } };

  const [campaignCount, memberCount, pendingEvaluations] = await Promise.all([
    prisma.evaluationCampaign.count({ where: scope }),
    prisma.organizationMember.count({
      where: authorization.isSuperAdmin
        ? undefined
        : { organizationId: { in: organizationIds } },
    }),
    prisma.evaluation.count({
      where: { evaluatorId: user.id, status: "DRAFT" },
    }),
  ]);

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 bg-emerald-500" />
            <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
              Authenticated workspace
            </p>
          </div>
          <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
            Decision control center
          </h1>
          <p className="mt-4 max-w-2xl text-[13px] leading-6 text-zinc-500">
            Manage organization access, confidential campaigns, and assigned
            evaluation work.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-zinc-950 px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-white uppercase dark:bg-white dark:text-zinc-950"
          href="/organizations/new"
        >
          Create organization
          <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 xl:grid-cols-4 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {[
          {
            label: "Organizations",
            value: authorization.organizations.length,
            icon: Building2,
          },
          { label: "Campaigns", value: campaignCount, icon: Scale },
          { label: "Members", value: memberCount, icon: Users },
          {
            label: "Pending evaluations",
            value: pendingEvaluations,
            icon: ShieldCheck,
          },
        ].map((stat) => (
          <article
            className="bg-[#EBE8E1] p-5 dark:bg-[#111]"
            key={stat.label}
          >
            <div className="flex items-center justify-between">
              <stat.icon
                aria-hidden="true"
                className="text-zinc-500"
                size={17}
              />
              <span className="text-[9px] text-zinc-500 uppercase">Live</span>
            </div>
            <p className="mt-8 text-3xl font-bold text-zinc-950 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-2 text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase">
              {stat.label}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
            Organization access
          </h2>
          <span className="text-[10px] text-zinc-500">
            {authorization.organizations.length} MEMBERSHIPS
          </span>
        </div>

        {authorization.organizations.length ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {authorization.organizations.map((organization) => (
              <Link
                className="flex items-center justify-between gap-5 py-5 transition-colors hover:text-indigo-500"
                href={`/organizations/${organization.id}`}
                key={organization.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-zinc-950 uppercase dark:text-white">
                    {organization.name}
                  </p>
                  <p className="mt-2 text-[10px] text-zinc-500 uppercase">
                    {organization.role} / {organization.slug}
                  </p>
                </div>
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-b border-black/[0.06] py-10 dark:border-white/[0.06]">
            <p className="text-[12px] leading-6 text-zinc-500">
              You do not belong to an organization yet. Create one or accept an
              invitation to begin.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
