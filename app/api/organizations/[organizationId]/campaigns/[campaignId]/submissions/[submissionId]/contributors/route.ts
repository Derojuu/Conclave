import { NextResponse } from "next/server";

import {
  ORGANIZATION_PERMISSIONS,
  roleHasPermission,
} from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  requireCurrentSubmissionPermission,
  requireMutableSubmissionCampaign,
} from "@/lib/security/submission-rbac";
import { ValidationError } from "@/lib/security/errors";
import { submissionContributorSchema } from "@/lib/validation/submission";

type SubmissionContributorsRouteContext = {
  params: Promise<{
    organizationId: string;
    campaignId: string;
    submissionId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: SubmissionContributorsRouteContext,
) {
  try {
    const { organizationId, campaignId, submissionId } = await params;
    const access = await requireCurrentSubmissionPermission(
      organizationId,
      campaignId,
      submissionId,
      ORGANIZATION_PERMISSIONS.submissionsRead,
    );
    const canManage =
      access.isSuperAdmin ||
      roleHasPermission(
        access.role,
        ORGANIZATION_PERMISSIONS.submissionsManage,
      );
    const [members, candidates] = await Promise.all([
      prisma.submissionContributor.findMany({
        where: { submissionId },
        orderBy: { member: { fullName: "asc" } },
        select: {
          createdAt: true,
          member: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
          addedBy: {
            select: { fullName: true },
          },
        },
      }),
      canManage
        ? prisma.organizationMember.findMany({
            where: {
              organizationId,
              user: {
                submissionContributions: {
                  none: { submissionId },
                },
              },
            },
            orderBy: { user: { fullName: "asc" } },
            select: {
              role: true,
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
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ members, candidates, canManage });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: SubmissionContributorsRouteContext,
) {
  try {
    const { organizationId, campaignId, submissionId } = await params;
    const { user, campaign, submission } =
      await requireCurrentSubmissionPermission(
        organizationId,
        campaignId,
        submissionId,
        ORGANIZATION_PERMISSIONS.submissionsManage,
      );
    requireMutableSubmissionCampaign(campaign.status);
    const input = submissionContributorSchema.parse(await request.json());
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: input.userId,
        },
      },
      select: {
        role: true,
        user: { select: { fullName: true } },
      },
    });

    if (!membership) {
      throw new ValidationError(
        "Only organization members can join a submission contributors.",
      );
    }

    const metadata = await getRequestMetadata();
    await withTransaction(async (transaction) => {
      await transaction.submissionContributor.create({
        data: {
          submissionId,
          userId: input.userId,
          addedById: user.id,
        },
      });
      await transaction.notification.create({
        data: {
          userId: input.userId,
          type: "CAMPAIGN",
          title: "Submission contributors assignment",
          body: `You were added to the ${submission.title} submission contributors.`,
          data: { organizationId, campaignId, submissionId },
        },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "SubmissionContributor",
          entityId: input.userId,
          metadata: {
            submissionId,
            assigned: true,
            role: membership.role,
            memberName: membership.user.fullName,
          },
          ...metadata,
        },
      });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
