import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  requireCurrentCampaignPermission,
  requireMutableCampaignRoster,
} from "@/lib/security/campaign-rbac";
import { ResourceNotFoundError } from "@/lib/security/errors";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      organizationId: string;
      campaignId: string;
      userId: string;
    }>;
  },
) {
  try {
    const { organizationId, campaignId, userId } = await params;
    const { user, campaign } = await requireCurrentCampaignPermission(
      organizationId,
      campaignId,
      ORGANIZATION_PERMISSIONS.campaignsManage,
    );
    requireMutableCampaignRoster(campaign.status);
    const metadata = await getRequestMetadata();

    await withTransaction(async (transaction) => {
      const removed = await transaction.campaignEvaluator.deleteMany({
        where: {
          campaignId,
          userId,
        },
      });

      if (removed.count !== 1) {
        throw new ResourceNotFoundError(
          "Campaign evaluator assignment not found.",
        );
      }

      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "DELETE",
          entityType: "CampaignEvaluator",
          entityId: userId,
          metadata: { assigned: false },
          ...metadata,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
