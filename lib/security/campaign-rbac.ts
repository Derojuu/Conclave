import "server-only";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError,
} from "@/lib/security/errors";
import { requireOrganizationPermission } from "@/lib/security/rbac";

export async function requireCampaignPermission(
  userId: string,
  organizationId: string,
  campaignId: string,
  permission:
    | typeof ORGANIZATION_PERMISSIONS.campaignsRead
    | typeof ORGANIZATION_PERMISSIONS.campaignsManage
    | typeof ORGANIZATION_PERMISSIONS.resultsRead
    | typeof ORGANIZATION_PERMISSIONS.resultsPublish,
) {
  const campaign = await prisma.evaluationCampaign.findFirst({
    where: {
      id: campaignId,
      organizationId,
    },
    select: {
      id: true,
      organizationId: true,
      title: true,
      status: true,
    },
  });

  if (!campaign) {
    throw new ResourceNotFoundError("Campaign not found.");
  }

  const access = await requireOrganizationPermission(
    userId,
    organizationId,
    permission,
  );

  if (
    (permission === ORGANIZATION_PERMISSIONS.campaignsRead ||
      permission === ORGANIZATION_PERMISSIONS.resultsRead) &&
    !access.isSuperAdmin &&
    access.role === "EVALUATOR"
  ) {
    const assignment = await prisma.campaignEvaluator.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId,
        },
      },
      select: { userId: true },
    });

    if (!assignment) {
      throw new AuthorizationError(
        "You are not assigned to this campaign.",
      );
    }
  }

  return { campaign, ...access };
}

export async function requireCurrentCampaignPermission(
  organizationId: string,
  campaignId: string,
  permission:
    | typeof ORGANIZATION_PERMISSIONS.campaignsRead
    | typeof ORGANIZATION_PERMISSIONS.campaignsManage
    | typeof ORGANIZATION_PERMISSIONS.resultsRead
    | typeof ORGANIZATION_PERMISSIONS.resultsPublish,
) {
  const user = await requireApiUser();
  const access = await requireCampaignPermission(
    user.id,
    organizationId,
    campaignId,
    permission,
  );

  return { user, ...access };
}

export function requireDraftCampaign(status: string) {
  if (status !== "DRAFT") {
    throw new ValidationError(
      "Campaign details and evaluation policy are immutable after the campaign opens.",
    );
  }
}

export function requireMutableCampaignRoster(status: string) {
  if (status !== "DRAFT" && status !== "OPEN") {
    throw new ValidationError(
      "The evaluator roster is locked after evaluation begins.",
    );
  }
}
