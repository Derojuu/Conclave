import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import {
  canTransitionCampaignStatus,
  campaignStatusLabels,
  type CampaignStatus,
} from "@/constants/campaign";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { requireCurrentCampaignPermission } from "@/lib/security/campaign-rbac";
import { ConflictError, ValidationError } from "@/lib/security/errors";
import { campaignStatusSchema } from "@/lib/validation/campaign";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      organizationId: string;
      campaignId: string;
    }>;
  },
) {
  try {
    const { organizationId, campaignId } = await params;
    const { user, campaign } =
      await requireCurrentCampaignPermission(
        organizationId,
        campaignId,
        ORGANIZATION_PERMISSIONS.campaignsManage,
      );
    const input = campaignStatusSchema.parse(await request.json());
    const currentStatus = campaign.status as CampaignStatus;

    if (
      input.status === currentStatus ||
      !canTransitionCampaignStatus(currentStatus, input.status)
    ) {
      throw new ValidationError(
        `Cannot move this campaign from ${campaignStatusLabels[currentStatus]} to ${campaignStatusLabels[input.status]}.`,
      );
    }

    if (currentStatus === "OPEN" && input.status === "EVALUATING") {
      const readiness = await prisma.evaluationCampaign.findUniqueOrThrow({
        where: { id: campaignId },
        select: {
          deadline: true,
          evaluationTemplate: {
            select: {
              _count: { select: { criteria: true } },
            },
          },
          _count: {
            select: {
              evaluators: true,
              submissions: {
                where: {
                  status: {
                    notIn: ["DRAFT", "WITHDRAWN", "ARCHIVED"],
                  },
                },
              },
            },
          },
        },
      });

      if (
        !readiness.evaluationTemplate ||
        readiness.evaluationTemplate._count.criteria === 0
      ) {
        throw new ValidationError(
          "Select an evaluation template with at least one criterion before evaluation begins.",
        );
      }
      if (readiness._count.evaluators === 0) {
        throw new ValidationError(
          "Assign at least one evaluator before evaluation begins.",
        );
      }
      if (readiness._count.submissions === 0) {
        throw new ValidationError(
          "At least one submitted item is required before evaluation begins.",
        );
      }
      if (readiness.deadline && readiness.deadline <= new Date()) {
        throw new ValidationError(
          "Set a future campaign deadline before evaluation begins.",
        );
      }
    }

    const metadata = await getRequestMetadata();
    const updated = await withTransaction(async (transaction) => {
      const changed = await transaction.evaluationCampaign.updateMany({
        where: { id: campaignId, status: currentStatus },
        data: { status: input.status },
      });
      if (changed.count !== 1) {
        throw new ConflictError(
          "The campaign status changed in another request. Refresh and try again.",
        );
      }
      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "CampaignStatus",
          entityId: campaignId,
          metadata: {
            previousStatus: currentStatus,
            status: input.status,
          },
          ...metadata,
        },
      });

      return transaction.evaluationCampaign.findUniqueOrThrow({
        where: { id: campaignId },
        select: { id: true, status: true },
      });
    });

    revalidatePath(
      `/organizations/${organizationId}/campaigns/${campaignId}`,
    );
    return NextResponse.json({ campaign: updated });
  } catch (error) {
    return apiError(error);
  }
}
