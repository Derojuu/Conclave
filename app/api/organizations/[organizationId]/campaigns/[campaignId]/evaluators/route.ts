import { NextResponse } from "next/server";

import {
  ORGANIZATION_PERMISSIONS,
  roleHasPermission,
} from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { requireCurrentCampaignPermission } from "@/lib/security/campaign-rbac";
import { requireMutableCampaignRoster } from "@/lib/security/campaign-rbac";
import { ValidationError } from "@/lib/security/errors";
import { campaignEvaluatorSchema } from "@/lib/validation/campaign";

type EvaluatorsRouteContext = {
  params: Promise<{
    organizationId: string;
    campaignId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: EvaluatorsRouteContext,
) {
  try {
    const { organizationId, campaignId } = await params;
    const access = await requireCurrentCampaignPermission(
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
    const [evaluators, candidates] = await Promise.all([
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
      canManage
        ? prisma.organizationMember.findMany({
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
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      evaluators,
      candidates: candidates.map((candidate) => candidate.user),
      canManage,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: EvaluatorsRouteContext,
) {
  try {
    const { organizationId, campaignId } = await params;
    const { user, campaign } =
      await requireCurrentCampaignPermission(
        organizationId,
        campaignId,
        ORGANIZATION_PERMISSIONS.campaignsManage,
      );
    requireMutableCampaignRoster(campaign.status);
    const input = campaignEvaluatorSchema.parse(await request.json());
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: input.userId,
        },
      },
      select: {
        role: true,
        user: {
          select: { fullName: true },
        },
      },
    });

    if (!membership || membership.role !== "EVALUATOR") {
      throw new ValidationError(
        "Only organization members with the Evaluator role can be assigned.",
      );
    }

    const metadata = await getRequestMetadata();
    await withTransaction(async (transaction) => {
      await transaction.campaignEvaluator.create({
        data: {
          campaignId,
          userId: input.userId,
          assignedById: user.id,
        },
      });
      await transaction.notification.create({
        data: {
          userId: input.userId,
          type: "CAMPAIGN",
          title: "Campaign assignment",
          body: `You were assigned to ${campaign.title}.`,
          data: { organizationId, campaignId },
        },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "CampaignEvaluator",
          entityId: input.userId,
          metadata: {
            assigned: true,
            evaluatorName: membership.user.fullName,
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
