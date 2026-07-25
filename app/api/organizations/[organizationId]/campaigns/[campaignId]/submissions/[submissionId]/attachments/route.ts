import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  requireCurrentSubmissionPermission,
  requireMutableSubmissionCampaign,
} from "@/lib/security/submission-rbac";
import {
  ExternalServiceError,
  ValidationError,
} from "@/lib/security/errors";
import { createDownloadableAttachments } from "@/lib/submission-attachments";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getSubmissionAttachmentExtension,
  normalizeSubmissionAttachmentFileName,
  SUBMISSION_ATTACHMENT_BUCKET,
  SUBMISSION_ATTACHMENT_MAX_BYTES,
  SUBMISSION_ATTACHMENT_MAX_FILES,
} from "@/utils/submission-attachment";

export const runtime = "nodejs";

type SubmissionAttachmentsRouteContext = {
  params: Promise<{
    organizationId: string;
    campaignId: string;
    submissionId: string;
  }>;
};

function revalidateSubmissionAttachments(
  organizationId: string,
  campaignId: string,
  submissionId: string,
) {
  const base = `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}`;
  revalidatePath(base);
  revalidatePath(`${base}/attachments`);
}

export async function GET(
  _request: Request,
  { params }: SubmissionAttachmentsRouteContext,
) {
  try {
    const { organizationId, campaignId, submissionId } = await params;
    await requireCurrentSubmissionPermission(
      organizationId,
      campaignId,
      submissionId,
      ORGANIZATION_PERMISSIONS.submissionsRead,
    );
    const records = await prisma.submissionAttachment.findMany({
      where: { submissionId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        storagePath: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });
    const attachments = await createDownloadableAttachments(records);

    return NextResponse.json({ attachments });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: SubmissionAttachmentsRouteContext,
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

    const formData = await request.formData();
    const file = formData.get("attachment");

    if (!(file instanceof File)) {
      throw new ValidationError("Select a file to upload.");
    }
    if (file.size <= 0 || file.size > SUBMISSION_ATTACHMENT_MAX_BYTES) {
      throw new ValidationError("Attachments must be smaller than 25 MB.");
    }

    const extension = getSubmissionAttachmentExtension(file);
    if (!extension) {
      throw new ValidationError(
        "Use PDF, image, text, CSV, Office document, or ZIP files.",
      );
    }

    const attachmentCount = await prisma.submissionAttachment.count({
      where: { submissionId },
    });
    if (attachmentCount >= SUBMISSION_ATTACHMENT_MAX_FILES) {
      throw new ValidationError(
        `A submission can contain at most ${SUBMISSION_ATTACHMENT_MAX_FILES} attachments.`,
      );
    }

    const fileName = normalizeSubmissionAttachmentFileName(file.name);
    const storagePath = `${organizationId}/${campaignId}/${submissionId}/${randomUUID()}.${extension}`;
    const storage = getSupabaseAdminClient().storage.from(
      SUBMISSION_ATTACHMENT_BUCKET,
    );
    const { error: uploadError } = await storage.upload(
      storagePath,
      new Uint8Array(await file.arrayBuffer()),
      {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      },
    );

    if (uploadError) {
      throw new ExternalServiceError(
        `Attachment upload failed: ${uploadError.message}`,
      );
    }

    try {
      const requestMetadata = await getRequestMetadata();
      const record = await withTransaction(async (transaction) => {
        const attachment = await transaction.submissionAttachment.create({
          data: {
            submissionId,
            storageBucket: SUBMISSION_ATTACHMENT_BUCKET,
            storagePath,
            fileName,
            mimeType: file.type,
            sizeBytes: BigInt(file.size),
            metadata: {
              lastModified: file.lastModified || null,
            },
          },
          select: {
            id: true,
            storagePath: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        });
        await transaction.auditLog.create({
          data: {
            organizationId,
            campaignId,
            actorId: user.id,
            action: "CREATE",
            entityType: "SubmissionAttachment",
            entityId: attachment.id,
            metadata: {
              submissionId,
              submissionTitle: submission.title,
              fileName,
              mimeType: file.type,
              sizeBytes: file.size,
            },
            ...requestMetadata,
          },
        });

        return attachment;
      });
      const [attachment] = await createDownloadableAttachments([record]);

      revalidateSubmissionAttachments(
        organizationId,
        campaignId,
        submissionId,
      );
      return NextResponse.json({ attachment }, { status: 201 });
    } catch (error) {
      const { error: cleanupError } = await storage.remove([storagePath]);
      if (cleanupError) {
        console.error("Unable to roll back attachment upload.", cleanupError);
      }
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
