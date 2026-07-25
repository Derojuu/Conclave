import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import {
  canTransitionSubmissionStatus,
  submissionStatusLabels,
  type SubmissionStatus,
} from "@/constants/submission";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { getRequestMetadata } from "@/lib/request-metadata";
import { requireCurrentSubmissionPermission } from "@/lib/security/submission-rbac";
import { requireMutableSubmissionCampaign } from "@/lib/security/submission-rbac";
import { ValidationError } from "@/lib/security/errors";
import { submissionStatusSchema } from "@/lib/validation/submission";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      organizationId: string;
      campaignId: string;
      submissionId: string;
    }>;
  },
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
    const input = submissionStatusSchema.parse(await request.json());
    const currentStatus = submission.status as SubmissionStatus;
    requireMutableSubmissionCampaign(campaign.status);

    if (
      input.status === currentStatus ||
      !canTransitionSubmissionStatus(currentStatus, input.status)
    ) {
      throw new ValidationError(
        `Cannot move this submission from ${submissionStatusLabels[currentStatus]} to ${submissionStatusLabels[input.status]}.`,
      );
    }

    const metadata = await getRequestMetadata();
    const updated = await withTransaction(async (transaction) => {
      const record = await transaction.submission.update({
        where: { id: submissionId },
        data: { status: input.status },
        select: { id: true, status: true },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "SubmissionStatus",
          entityId: submissionId,
          metadata: {
            previousStatus: currentStatus,
            status: input.status,
          },
          ...metadata,
        },
      });

      return record;
    });

    revalidatePath(
      `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}`,
    );
    return NextResponse.json({ submission: updated });
  } catch (error) {
    return apiError(error);
  }
}
