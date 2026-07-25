import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  requireCurrentSubmissionPermission,
  requireMutableSubmissionCampaign,
} from "@/lib/security/submission-rbac";
import { ResourceNotFoundError } from "@/lib/security/errors";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      organizationId: string;
      campaignId: string;
      submissionId: string;
      userId: string;
    }>;
  },
) {
  try {
    const { organizationId, campaignId, submissionId, userId } =
      await params;
    const { user, campaign } =
      await requireCurrentSubmissionPermission(
        organizationId,
        campaignId,
        submissionId,
        ORGANIZATION_PERMISSIONS.submissionsManage,
      );
    requireMutableSubmissionCampaign(campaign.status);
    const metadata = await getRequestMetadata();

    await withTransaction(async (transaction) => {
      const removed = await transaction.submissionContributor.deleteMany({
        where: { submissionId, userId },
      });

      if (removed.count !== 1) {
        throw new ResourceNotFoundError(
          "Submission contributors member not found.",
        );
      }

      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "DELETE",
          entityType: "SubmissionContributor",
          entityId: userId,
          metadata: { submissionId, assigned: false },
          ...metadata,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
