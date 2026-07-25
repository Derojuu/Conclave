import type { Metadata } from "next";

import { CampaignEvaluatorsManager } from "@/components/campaigns/campaign-evaluators-manager";
import { CampaignNavigation } from "@/components/campaigns/campaign-navigation";
import { CampaignPageHeader } from "@/components/campaigns/campaign-page-header";
import {
  ORGANIZATION_PERMISSIONS,
  roleHasPermission,
} from "@/constants/auth";
import type { CampaignStatus } from "@/constants/campaign";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCampaignPermission } from "@/lib/security/campaign-rbac";

export const metadata: Metadata = {
  title: "Campaign members",
  robots: { index: false, follow: false },
};

export default async function CampaignMembersPage({
  params,
}: {
  params: Promise<{ organizationId: string; campaignId: string }>;
}) {
  const { organizationId, campaignId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns/${campaignId}/members`,
  });
  const access = await requireCampaignPermission(
    user.id,
    organizationId,
    campaignId,
    ORGANIZATION_PERMISSIONS.campaignsRead,
  );
  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(
      access.role,
      ORGANIZATION_PERMISSIONS.campaignsManage,
    );
  const [campaign, evaluators] = await Promise.all([
    prisma.evaluationCampaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: {
        title: true,
        description: true,
        status: true,
        organization: { select: { name: true } },
      },
    }),
    prisma.campaignEvaluator.findMany({
      where: { campaignId },
      orderBy: { evaluator: { fullName: "asc" } },
      select: {
        createdAt: true,
        evaluator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        assignedBy: {
          select: { fullName: true },
        },
      },
    }),
  ]);
  const candidates = canManage
    ? await prisma.organizationMember.findMany({
        where: {
          organizationId,
          role: "EVALUATOR",
          user: {
            campaignAssignments: {
              none: { campaignId },
            },
          },
        },
        orderBy: { user: { fullName: "asc" } },
        select: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
        },
      })
    : [];
  const mutable =
    campaign.status === "DRAFT" || campaign.status === "OPEN";

  return (
    <div className="max-w-5xl">
      <CampaignPageHeader
        organizationId={organizationId}
        organizationName={campaign.organization.name}
        status={campaign.status as CampaignStatus}
        title={campaign.title}
      />
      <CampaignNavigation
        canManage={canManage}
        campaignId={campaignId}
        organizationId={organizationId}
      />
      <section className="mt-8 border-y border-black/[0.06] py-8 dark:border-white/[0.06]">
        <CampaignEvaluatorsManager
          candidates={candidates.map(({ user: candidate }) => candidate)}
          canManage={canManage && mutable}
          campaignId={campaignId}
          evaluators={evaluators.map((assignment) => ({
            ...assignment.evaluator,
            assignedAt: assignment.createdAt.toISOString(),
            assignedBy: assignment.assignedBy?.fullName ?? null,
          }))}
          organizationId={organizationId}
        />
      </section>
    </div>
  );
}
