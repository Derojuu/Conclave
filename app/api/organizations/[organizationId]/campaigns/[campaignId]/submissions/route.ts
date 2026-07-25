import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  requireCampaignSubmissionPermission,
  requireMutableSubmissionCampaign,
} from "@/lib/security/submission-rbac";
import { submissionSchema } from "@/lib/validation/submission";

type SubmissionsRouteContext = {
  params: Promise<{
    organizationId: string;
    campaignId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: SubmissionsRouteContext,
) {
  try {
    const { organizationId, campaignId } = await params;
    const user = await requireApiUser();
    await requireCampaignSubmissionPermission(
      user.id,
      organizationId,
      campaignId,
      ORGANIZATION_PERMISSIONS.submissionsRead,
    );
    const submissions = await prisma.submission.findMany({
      where: { campaignId },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        kind: true,
        status: true,
        metadata: true,
        links: {
          orderBy: { position: "asc" },
          select: { id: true, type: true, label: true, url: true },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contributors: true,
            evaluations: true,
            attachments: true,
          },
        },
      },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: SubmissionsRouteContext,
) {
  try {
    const { organizationId, campaignId } = await params;
    const user = await requireApiUser();
    const access = await requireCampaignSubmissionPermission(
      user.id,
      organizationId,
      campaignId,
      ORGANIZATION_PERMISSIONS.submissionsManage,
    );
    requireMutableSubmissionCampaign(access.campaign.status);
    const input = submissionSchema.parse(await request.json());
    const metadata = await getRequestMetadata();

    const submission = await withTransaction(async (transaction) => {
      const created = await transaction.submission.create({
        data: {
          campaignId,
          title: input.title,
          description: input.description,
          kind: input.kind || null,
          metadata: input.metadata,
          ownerId: user.id,
          contributors: {
            create: {
              userId: user.id,
              addedById: user.id,
              role: "OWNER",
            },
          },
          links: {
            create: input.links.map((link, position) => ({
              ...link,
              position,
            })),
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "CREATE",
          entityType: "Submission",
          entityId: created.id,
          metadata: {
            title: created.title,
            kind: created.kind,
            status: created.status,
            linkCount: input.links.length,
          },
          ...metadata,
        },
      });

      return created;
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
