import type { Metadata } from "next";
import {
  Activity,
  Building2,
  CircleAlert,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { requireAuthenticatedUser } from "@/lib/auth";
import { getPlatformOverview } from "@/lib/platform-admin";
import { requireSuperAdmin } from "@/lib/security/rbac";

export const metadata: Metadata = {
  title: "Platform administration",
  robots: { index: false, follow: false },
};

export default async function PlatformAdminPage() {
  const user = await requireAuthenticatedUser({ next: "/admin" });
  await requireSuperAdmin(user.id);
  const overview = await getPlatformOverview();
  const stats = [
    { label: "Users", value: overview.stats.userCount, icon: Users },
    {
      label: "Organizations",
      value: overview.stats.organizationCount,
      icon: Building2,
    },
    {
      label: "Campaigns",
      value: overview.stats.campaignCount,
      icon: Scale,
    },
    {
      label: "Verified results",
      value: overview.stats.verifiedResultCount,
      icon: ShieldCheck,
    },
    {
      label: "Active computations",
      value: overview.stats.activeComputationCount,
      icon: Activity,
    },
    {
      label: "Failed computations",
      value: overview.stats.failedComputationCount,
      icon: CircleAlert,
    },
  ];

  return (
    <div className="max-w-7xl">
      <p className="text-[10px] font-bold tracking-[0.16em] text-emerald-500 uppercase">
        Super admin
      </p>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        Platform administration
      </h1>
      <p className="mt-4 max-w-2xl text-[13px] leading-6 text-zinc-500">
        Operational visibility across organizations, campaigns, and aggregate
        confidential-computation jobs.
      </p>

      <section className="mt-9 grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 xl:grid-cols-3 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {stats.map((stat) => (
          <article className="bg-[#EBE8E1] p-5 dark:bg-[#111]" key={stat.label}>
            <stat.icon aria-hidden="true" className="text-zinc-500" size={17} />
            <p className="mt-7 text-3xl font-bold text-zinc-950 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-2 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              {stat.label}
            </p>
          </article>
        ))}
      </section>

      <div className="mt-10 grid gap-10 xl:grid-cols-2">
        <section>
          <h2 className="border-b border-black/[0.06] pb-4 text-[12px] font-bold tracking-[0.1em] text-zinc-950 uppercase dark:border-white/[0.06] dark:text-white">
            Recent organizations
          </h2>
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {overview.recentOrganizations.map((organization) => (
              <Link
                className="flex items-center justify-between gap-5 py-4"
                href={`/organizations/${organization.id}`}
                key={organization.id}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold text-zinc-950 uppercase dark:text-white">
                    {organization.name}
                  </span>
                  <span className="mt-1 block truncate text-[9px] text-zinc-500">
                    {organization.owner.fullName} /{" "}
                    {organization._count.members} members /{" "}
                    {organization._count.campaigns} campaigns
                  </span>
                </span>
                <span className="text-[9px] text-zinc-400 uppercase">
                  {organization.slug}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="border-b border-black/[0.06] pb-4 text-[12px] font-bold tracking-[0.1em] text-zinc-950 uppercase dark:border-white/[0.06] dark:text-white">
            Recent users
          </h2>
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {overview.recentUsers.map((record) => (
              <div
                className="flex items-center justify-between gap-5 py-4"
                key={record.id}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold text-zinc-950 dark:text-white">
                    {record.fullName}
                  </span>
                  <span className="mt-1 block truncate text-[9px] text-zinc-500">
                    {record.email} / {record._count.memberships} memberships
                  </span>
                </span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase">
                  {record.platformRole.replaceAll("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="border-b border-black/[0.06] pb-4 text-[12px] font-bold tracking-[0.1em] text-zinc-950 uppercase dark:border-white/[0.06] dark:text-white">
          Computation activity
        </h2>
        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
          {overview.recentComputations.map((job) => (
            <Link
              className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              href={`/organizations/${job.campaign.organizationId}/campaigns/${job.campaign.id}/results`}
              key={job.id}
            >
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-bold text-zinc-950 dark:text-white">
                  {job.campaign.title}
                </span>
                <span className="mt-1 block truncate text-[9px] text-zinc-500">
                  {job.campaign.organization.name} / {job.provider}
                </span>
              </span>
              <span className="text-[9px] text-zinc-500">
                {job.providerTaskId ?? "TASK PENDING"}
              </span>
              <span
                className={
                  job.status === "FAILED"
                    ? "text-[9px] font-bold text-rose-500 uppercase"
                    : job.status === "SUCCEEDED"
                      ? "text-[9px] font-bold text-emerald-500 uppercase"
                      : "text-[9px] font-bold text-amber-500 uppercase"
                }
              >
                {job.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
