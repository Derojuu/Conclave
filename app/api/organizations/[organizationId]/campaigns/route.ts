import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { ValidationError } from "@/lib/security/errors";
import { requireCurrentOrganizationPermission } from "@/lib/security/rbac";
import { campaignSchema } from "@/lib/validation/campaign";

type CampaignsRouteContext = {
  params: Promise<{ organizationId: string }>;
};

async function validateTemplate(
  organizationId: string,
  evaluationTemplateId: string | null | undefined,
) {
  if (!evaluationTemplateId) {
    return;
  }

  const template = await prisma.evaluationTemplate.findFirst({
    where: {
      id: evaluationTemplateId,
      organizationId,
    },
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
  { params }: CampaignsRouteContext,
) {
  try {
    const { organizationId } = await params;
    const { user, role, isSuperAdmin } =
      await requireCurrentOrganizationPermission(
        organizationId,
        ORGANIZATION_PERMISSIONS.campaignsRead,
      );
    const campaigns = await prisma.evaluationCampaign.findMany({
      where: {
        organizationId,
        ...(!isSuperAdmin && role === "EVALUATOR"
          ? { evaluators: { some: { userId: user.id } } }
          : {}),
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        deadline: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            evaluators: true,
            submissions: true,
            evaluations: true,
          },
        },
      },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: CampaignsRouteContext,
) {
  try {
    const { organizationId } = await params;
    const { user } = await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.campaignsManage,
    );
    const input = campaignSchema.parse(await request.json());
    await validateTemplate(
      organizationId,
      input.evaluationTemplateId,
    );
    const metadata = await getRequestMetadata();

    const campaign = await withTransaction(async (transaction) => {
      const created = await transaction.evaluationCampaign.create({
        data: {
          organizationId,
          title: input.title,
          description: input.description,
          deadline: input.deadline ? new Date(input.deadline) : null,
          evaluationTemplateId: input.evaluationTemplateId || null,
          createdById: user.id,
        },
      });

      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId: created.id,
          actorId: user.id,
          action: "CREATE",
          entityType: "Campaign",
          entityId: created.id,
          metadata: { status: created.status },
          ...metadata,
        },
      });

      return created;
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
