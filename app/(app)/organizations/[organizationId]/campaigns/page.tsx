import type { Metadata } from "next";
import { ArrowRight, Plus, Scale } from "lucide-react";
import Link from "next/link";

import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { OrganizationNavigation } from "@/components/organizations/organization-navigation";
import { ORGANIZATION_PERMISSIONS, roleHasPermission } from "@/constants/auth";
import type { CampaignStatus } from "@/constants/campaign";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrganizationPermission } from "@/lib/security/rbac";

export const metadata: Metadata = {
  title: "Campaigns",
  robots: { index: false, follow: false },
};

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns`,
  });
  const access = await requireOrganizationPermission(
    user.id,
    organizationId,
    ORGANIZATION_PERMISSIONS.campaignsRead,
  );
  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.campaignsManage);
  const campaigns = await prisma.evaluationCampaign.findMany({
    where: {
      organizationId,
      ...(!access.isSuperAdmin && access.role === "EVALUATOR"
        ? { evaluators: { some: { userId: user.id } } }
        : {}),
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      deadline: true,
      updatedAt: true,
      _count: {
        select: {
          evaluators: true,
          submissions: true,
          evaluations: true,
        },
      },
    },
  });

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
            {access.organization.slug} / campaigns
          </p>
          <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
            Campaign management
          </h1>
          <p className="mt-4 max-w-2xl text-[13px] leading-6 text-zinc-500">
            Configure confidential decision groups, assign evaluators, and
            manage each campaign lifecycle.
          </p>
        </div>
        {canManage ? (
          <Link
            className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[10px] font-bold tracking-[0.1em] uppercase dark:bg-white"
            href={`/organizations/${organizationId}/campaigns/new`}
          >
            <Plus aria-hidden="true" size={14} />
            New campaign
          </Link>
        ) : null}
      </div>

      <OrganizationNavigation
        canManageSettings={canManage}
        canReadAudit={canManage}
        organizationId={organizationId}
      />

      {campaigns.length ? (
        <div className="mt-8 divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.06] dark:border-white/[0.06]">
          {campaigns.map((campaign) => (
            <Link
              className="group grid gap-5 py-6 transition-colors hover:text-indigo-500 sm:grid-cols-[1fr_auto] sm:items-center"
              href={`/organizations/${organizationId}/campaigns/${campaign.id}`}
              key={campaign.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Scale
                    aria-hidden="true"
                    className="text-zinc-500"
                    size={15}
                  />
                  <h2 className="min-w-0 text-[12px] font-bold break-words text-zinc-950 uppercase group-hover:text-indigo-500 dark:text-white">
                    {campaign.title}
                  </h2>
                  <CampaignStatusBadge
                    status={campaign.status as CampaignStatus}
                  />
                </div>
                <p className="mt-3 line-clamp-2 max-w-3xl text-[11px] leading-5 text-zinc-500">
                  {campaign.description}
                </p>
                <p className="mt-3 text-[9px] tracking-[0.08em] text-zinc-500 uppercase">
                  {campaign._count.evaluators} evaluators /{" "}
                  {campaign._count.submissions} submissions /{" "}
                  {campaign._count.evaluations} evaluations
                  {campaign.deadline
                    ? ` / due ${new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                      }).format(campaign.deadline)}`
                    : ""}
                </p>
              </div>
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 border-y border-black/[0.06] py-12 text-center dark:border-white/[0.06]">
          <Scale
            aria-hidden="true"
            className="mx-auto text-zinc-500"
            size={20}
          />
          <p className="mt-4 text-[12px] text-zinc-500">
            {canManage
              ? "Create the first campaign for this organization."
              : "No campaigns are currently assigned to you."}
          </p>
        </div>
      )}
    </div>
  );
}
