import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Scale,
  Users,
} from "lucide-react";
import Link from "next/link";

import { OrganizationNavigation } from "@/components/organizations/organization-navigation";
import {
  ORGANIZATION_PERMISSIONS,
  roleHasPermission,
} from "@/constants/auth";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrganizationPermission } from "@/lib/security/rbac";

export const metadata: Metadata = {
  title: "Organization dashboard",
  robots: { index: false, follow: false },
};

export default async function OrganizationDashboardPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}`,
  });
  const access = await requireOrganizationPermission(
    user.id,
    organizationId,
    ORGANIZATION_PERMISSIONS.read,
  );
  const canManageSettings =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.update);

  const [
    organization,
    memberCount,
    campaignCount,
    submissionCount,
    pendingEvaluations,
  ] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        createdAt: true,
        owner: {
          select: {
            fullName: true,
            email: true,
          },
        },
        campaigns: {
          orderBy: { updatedAt: "desc" },
          take: 6,
          select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            _count: {
              select: {
                submissions: true,
                evaluations: true,
              },
            },
          },
        },
      },
    }),
    prisma.organizationMember.count({ where: { organizationId } }),
    prisma.evaluationCampaign.count({ where: { organizationId } }),
    prisma.submission.count({ where: { campaign: { organizationId } } }),
    prisma.evaluation.count({
      where: {
        evaluatorId: user.id,
        status: "DRAFT",
        campaign: { organizationId },
      },
    }),
  ]);

  const stats = [
    { label: "Members", value: memberCount, icon: Users },
    { label: "Campaigns", value: campaignCount, icon: Scale },
    { label: "Submissions", value: submissionCount, icon: Building2 },
    {
      label: "Your pending reviews",
      value: pendingEvaluations,
      icon: ClipboardCheck,
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-black/[0.08] bg-black/[0.02] text-sm font-bold text-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]">
            {organization.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${organization.name} logo`}
                className="h-full w-full object-cover"
                src={organization.logo}
              />
            ) : (
              organization.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
              {organization.slug} / organization
            </p>
            <h1 className="mt-3 truncate text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
              {organization.name}
            </h1>
          </div>
        </div>
        {canManageSettings ? (
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-black/[0.08] px-4 text-[10px] font-bold tracking-[0.08em] uppercase hover:border-indigo-500 hover:text-indigo-500 dark:border-white/[0.08]"
            href={`/organizations/${organizationId}/settings`}
          >
            Edit profile
            <ArrowRight aria-hidden="true" size={13} />
          </Link>
        ) : null}
      </div>

      <OrganizationNavigation
        canManageSettings={canManageSettings}
        canReadAudit={canManageSettings}
        organizationId={organizationId}
      />

      <section className="mt-8 border-y border-black/[0.06] py-6 dark:border-white/[0.06]">
        <p className="max-w-3xl text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
          {organization.description ||
            "No organization description has been added."}
        </p>
        <p className="mt-4 text-[10px] text-zinc-500">
          OWNER: {organization.owner.fullName} / {organization.owner.email}
        </p>
      </section>

      <section className="mt-8 grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 xl:grid-cols-4 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {stats.map((stat) => (
          <article className="bg-[#EBE8E1] p-5 dark:bg-[#111]" key={stat.label}>
            <stat.icon
              aria-hidden="true"
              className="text-zinc-500"
              size={17}
            />
            <p className="mt-7 text-3xl font-bold text-zinc-950 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-2 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              {stat.label}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
            Recent campaigns
          </h2>
          <span className="text-[10px] text-zinc-500">
            {organization.campaigns.length} SHOWN
          </span>
        </div>
        {organization.campaigns.length ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {organization.campaigns.map((campaign) => (
              <Link
                className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
                href={`/organizations/${organizationId}/campaigns/${campaign.id}`}
                key={campaign.id}
              >
                <div>
                  <p className="text-[13px] font-bold text-zinc-950 dark:text-white">
                    {campaign.title}
                  </p>
                  <p className="mt-2 text-[10px] text-zinc-500">
                    {campaign._count.submissions} SUBMISSIONS /{" "}
                    {campaign._count.evaluations} EVALUATIONS
                  </p>
                </div>
                <span className="w-fit border border-black/[0.07] px-3 py-2 text-[10px] font-bold text-zinc-500 dark:border-white/[0.07]">
                  {campaign.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="border-b border-black/[0.06] py-8 text-[12px] text-zinc-500 dark:border-white/[0.06]">
            No campaigns have been created for this organization.
          </p>
        )}
      </section>
    </div>
  );
}
