import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { ResourceNotFoundError } from "@/lib/security/errors";
import {
  requireCurrentSubmissionPermission,
  requireMutableSubmissionCampaign,
} from "@/lib/security/submission-rbac";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      organizationId: string;
      campaignId: string;
      submissionId: string;
      attachmentId: string;
    }>;
  },
) {
  try {
    const {
      organizationId,
      campaignId,
      submissionId,
      attachmentId,
    } = await params;
    const { user, campaign } =
      await requireCurrentSubmissionPermission(
        organizationId,
        campaignId,
        submissionId,
        ORGANIZATION_PERMISSIONS.submissionsManage,
      );
    requireMutableSubmissionCampaign(campaign.status);

    const attachment = await prisma.submissionAttachment.findFirst({
      where: { id: attachmentId, submissionId },
      select: {
        id: true,
        storageBucket: true,
        storagePath: true,
        fileName: true,
      },
    });
    if (!attachment) {
      throw new ResourceNotFoundError("Attachment not found.");
    }

    const requestMetadata = await getRequestMetadata();
    await withTransaction(async (transaction) => {
      await transaction.submissionAttachment.delete({
        where: { id: attachment.id },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "DELETE",
          entityType: "SubmissionAttachment",
          entityId: attachment.id,
          metadata: {
            submissionId,
            fileName: attachment.fileName,
          },
          ...requestMetadata,
        },
      });
    });

    const { error: storageError } = await getSupabaseAdminClient()
      .storage.from(attachment.storageBucket)
      .remove([attachment.storagePath]);
    if (storageError) {
      console.error(
        `Unable to remove attachment object ${attachment.id}.`,
        storageError,
      );
    }

    const base = `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}`;
    revalidatePath(base);
    revalidatePath(`${base}/attachments`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
