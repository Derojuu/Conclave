import "server-only";

import {
  ORGANIZATION_PERMISSIONS,
  type OrganizationPermission,
} from "@/constants/auth";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError,
} from "@/lib/security/errors";
import { requireOrganizationPermission } from "@/lib/security/rbac";

type SubmissionPermission =
  | typeof ORGANIZATION_PERMISSIONS.submissionsRead
  | typeof ORGANIZATION_PERMISSIONS.submissionsManage;

export async function requireCampaignSubmissionPermission(
  userId: string,
  organizationId: string,
  campaignId: string,
  permission: SubmissionPermission,
) {
  const campaign = await prisma.evaluationCampaign.findFirst({
    where: { id: campaignId, organizationId },
    select: {
      id: true,
      title: true,
      status: true,
      organizationId: true,
    },
  });

  if (!campaign) {
    throw new ResourceNotFoundError("Campaign not found.");
  }

  const access = await requireOrganizationPermission(
    userId,
    organizationId,
    permission as OrganizationPermission,
  );

  if (
    permission === ORGANIZATION_PERMISSIONS.submissionsRead &&
    !access.isSuperAdmin &&
    access.role === "EVALUATOR"
  ) {
    const assignment = await prisma.campaignEvaluator.findUnique({
      where: {
        campaignId_userId: { campaignId, userId },
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

export async function requireSubmissionPermission(
  userId: string,
  organizationId: string,
  campaignId: string,
  submissionId: string,
  permission: SubmissionPermission,
) {
  const access = await requireCampaignSubmissionPermission(
    userId,
    organizationId,
    campaignId,
    permission,
  );
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, campaignId },
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
    },
  });

  if (!submission) {
    throw new ResourceNotFoundError("Submission not found.");
  }

  return { submission, ...access };
}

export async function requireCurrentSubmissionPermission(
  organizationId: string,
  campaignId: string,
  submissionId: string,
  permission: SubmissionPermission,
) {
  const user = await requireApiUser();
  const access = await requireSubmissionPermission(
    user.id,
    organizationId,
    campaignId,
    submissionId,
    permission,
  );

  return { user, ...access };
}

export function requireMutableSubmissionCampaign(status: string) {
  if (status !== "DRAFT" && status !== "OPEN") {
    throw new ValidationError(
      "Submission details and contributors are locked after evaluation begins.",
    );
  }
}
