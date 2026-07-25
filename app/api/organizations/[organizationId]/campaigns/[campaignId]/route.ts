import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { removeSubmissionAttachmentObjects } from "@/lib/submission-attachments";
import {
  requireCurrentCampaignPermission,
  requireDraftCampaign,
} from "@/lib/security/campaign-rbac";
import { ValidationError } from "@/lib/security/errors";
import {
  campaignDeleteSchema,
  campaignSchema,
} from "@/lib/validation/campaign";

type CampaignRouteContext = {
  params: Promise<{
    organizationId: string;
    campaignId: string;
  }>;
};

async function validateTemplate(
  organizationId: string,
  evaluationTemplateId: string | null | undefined,
) {
  if (!evaluationTemplateId) {
    return;
  }

  const template = await prisma.evaluationTemplate.findFirst({
    where: { id: evaluationTemplateId, organizationId },
    select: { id: true },
  });

  if (!template) {
    throw new ValidationError(
      "The selected evaluation template is unavailable.",
    );
  }
}

export async function GET(
  _request: Request,
  { params }: CampaignRouteContext,
) {
  try {
    const { organizationId, campaignId } = await params;
    await requireCurrentCampaignPermission(
      organizationId,
      campaignId,
      ORGANIZATION_PERMISSIONS.campaignsRead,
    );
    const campaign = await prisma.evaluationCampaign.findUniqueOrThrow({
      where: { id: campaignId },
      include: {
        evaluationTemplate: {
          select: { id: true, title: true, version: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: {
            evaluators: true,
            submissions: true,
            evaluations: true,
          },
        },
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: CampaignRouteContext,
) {
  try {
    const { organizationId, campaignId } = await params;
    const { user, campaign: accessCampaign } =
      await requireCurrentCampaignPermission(
      organizationId,
      campaignId,
      ORGANIZATION_PERMISSIONS.campaignsManage,
    );
    requireDraftCampaign(accessCampaign.status);
    const input = campaignSchema.parse(await request.json());
    await validateTemplate(
      organizationId,
      input.evaluationTemplateId,
    );
    const metadata = await getRequestMetadata();

    const campaign = await withTransaction(async (transaction) => {
      const updated = await transaction.evaluationCampaign.update({
        where: { id: campaignId },
        data: {
          title: input.title,
          description: input.description,
          deadline: input.deadline ? new Date(input.deadline) : null,
          evaluationTemplateId: input.evaluationTemplateId || null,
        },
      });

      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "Campaign",
          entityId: campaignId,
          metadata: { detailsUpdated: true },
          ...metadata,
        },
      });

      return updated;
    });

    revalidatePath(
      `/organizations/${organizationId}/campaigns/${campaignId}`,
    );
    return NextResponse.json({ campaign });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: CampaignRouteContext,
) {
  try {
    const { organizationId, campaignId } = await params;
    const { user, campaign } =
      await requireCurrentCampaignPermission(
        organizationId,
        campaignId,
        ORGANIZATION_PERMISSIONS.campaignsManage,
      );
    const input = campaignDeleteSchema.parse(await request.json());

    if (input.confirmation !== campaign.title) {
      throw new ValidationError(
        "Enter the campaign title exactly to confirm deletion.",
      );
    }

    if (
      campaign.status !== "DRAFT" &&
      campaign.status !== "ARCHIVED"
    ) {
      throw new ValidationError(
        "Only draft or archived campaigns can be deleted.",
      );
    }

    const metadata = await getRequestMetadata();
    const attachmentPaths = await withTransaction(async (transaction) => {
      const attachments = await transaction.submissionAttachment.findMany({
        where: {
          submission: { campaignId },
        },
        select: { storagePath: true },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "DELETE",
          entityType: "Campaign",
          entityId: campaignId,
          metadata: { title: campaign.title, status: campaign.status },
          ...metadata,
        },
      });
      await transaction.evaluationCampaign.delete({
        where: { id: campaignId },
      });

      return attachments.map((attachment) => attachment.storagePath);
    });
    await removeSubmissionAttachmentObjects(
      attachmentPaths,
      `campaign ${campaignId}`,
    );

    revalidatePath(`/organizations/${organizationId}/campaigns`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
