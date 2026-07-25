import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  createDownloadableAttachments,
  removeSubmissionAttachmentObjects,
} from "@/lib/submission-attachments";
import {
  requireCurrentSubmissionPermission,
  requireMutableSubmissionCampaign,
} from "@/lib/security/submission-rbac";
import { ValidationError } from "@/lib/security/errors";
import {
  submissionDeleteSchema,
  submissionSchema,
} from "@/lib/validation/submission";

type SubmissionRouteContext = {
  params: Promise<{
    organizationId: string;
    campaignId: string;
    submissionId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: SubmissionRouteContext,
) {
  try {
    const { organizationId, campaignId, submissionId } = await params;
    await requireCurrentSubmissionPermission(
      organizationId,
      campaignId,
      submissionId,
      ORGANIZATION_PERMISSIONS.submissionsRead,
    );
    const submission = await prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        contributors: {
          orderBy: { member: { fullName: "asc" } },
          select: {
            createdAt: true,
            role: true,
            member: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        links: {
          orderBy: { position: "asc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            storagePath: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            contributors: true,
            evaluations: true,
            attachments: true,
          },
        },
      },
    });
    const attachments = await createDownloadableAttachments(
      submission.attachments,
    );

    return NextResponse.json({
      submission: {
        ...submission,
        attachments,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: SubmissionRouteContext,
) {
  try {
    const { organizationId, campaignId, submissionId } = await params;
    const { user, campaign } =
      await requireCurrentSubmissionPermission(
        organizationId,
        campaignId,
        submissionId,
        ORGANIZATION_PERMISSIONS.submissionsManage,
      );
    requireMutableSubmissionCampaign(campaign.status);
    const input = submissionSchema.parse(await request.json());
    const metadata = await getRequestMetadata();

    const submission = await withTransaction(async (transaction) => {
      const updated = await transaction.submission.update({
        where: { id: submissionId },
        data: {
          title: input.title,
          description: input.description,
          kind: input.kind || null,
          metadata: input.metadata,
        },
      });
      await transaction.submissionLink.deleteMany({
        where: { submissionId },
      });
      if (input.links.length) {
        await transaction.submissionLink.createMany({
          data: input.links.map((link, position) => ({
            submissionId,
            ...link,
            position,
          })),
        });
      }
      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "Submission",
          entityId: submissionId,
          metadata: {
            detailsUpdated: true,
            linkCount: input.links.length,
          },
          ...metadata,
        },
      });

      return updated;
    });

    revalidatePath(
      `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}`,
    );
    return NextResponse.json({ submission });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: SubmissionRouteContext,
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
    const input = submissionDeleteSchema.parse(await request.json());

    if (input.confirmation !== submission.title) {
      throw new ValidationError(
        "Enter the submission title exactly to confirm deletion.",
      );
    }

    if (submission.status !== "DRAFT" && submission.status !== "ARCHIVED") {
      throw new ValidationError(
        "Only draft or archived submissions can be deleted.",
      );
    }

    const metadata = await getRequestMetadata();
    const attachmentPaths = await withTransaction(async (transaction) => {
      const attachments = await transaction.submissionAttachment.findMany({
        where: { submissionId },
        select: { storagePath: true },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "DELETE",
          entityType: "Submission",
          entityId: submissionId,
          metadata: {
            title: submission.title,
            status: submission.status,
          },
          ...metadata,
        },
      });
      await transaction.submission.delete({ where: { id: submissionId } });

      return attachments.map((attachment) => attachment.storagePath);
    });
    await removeSubmissionAttachmentObjects(
      attachmentPaths,
      `submission ${submissionId}`,
    );

    revalidatePath(
      `/organizations/${organizationId}/campaigns/${campaignId}/submissions`,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
