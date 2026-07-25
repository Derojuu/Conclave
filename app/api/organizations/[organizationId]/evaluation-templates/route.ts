import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { buildCriterionRecords } from "@/lib/evaluation-template";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { requireCurrentOrganizationPermission } from "@/lib/security/rbac";
import { evaluationTemplateSchema } from "@/lib/validation/evaluation-template";

type EvaluationTemplatesRouteContext = {
  params: Promise<{ organizationId: string }>;
};

export async function GET(
  _request: Request,
  { params }: EvaluationTemplatesRouteContext,
) {
  try {
    const { organizationId } = await params;
    await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.templatesRead,
    );
    const templates = await prisma.evaluationTemplate.findMany({
      where: { organizationId },
      orderBy: [{ title: "asc" }, { version: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        instructions: true,
        deadline: true,
        version: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        criteria: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            label: true,
            description: true,
            type: true,
            weight: true,
            minScore: true,
            maxScore: true,
            position: true,
          },
        },
        _count: {
          select: {
            criteria: true,
            campaigns: true,
          },
        },
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: EvaluationTemplatesRouteContext,
) {
  try {
    const { organizationId } = await params;
    const { user } = await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.templatesManage,
    );
    const input = evaluationTemplateSchema.parse(await request.json());
    const criteria = buildCriterionRecords(input.criteria);
    const metadata = await getRequestMetadata();

    const template = await withTransaction(async (transaction) => {
      if (input.isDefault) {
        await transaction.evaluationTemplate.updateMany({
          where: { organizationId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const created = await transaction.evaluationTemplate.create({
        data: {
          organizationId,
          title: input.title,
          description: input.description || null,
          instructions: input.instructions,
          deadline: input.deadline ? new Date(input.deadline) : null,
          isDefault: input.isDefault,
          createdById: user.id,
          criteria: {
            create: criteria,
          },
        },
        include: {
          criteria: {
            orderBy: { position: "asc" },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "CREATE",
          entityType: "EvaluationTemplate",
          entityId: created.id,
          metadata: {
            title: created.title,
            version: created.version,
            criteriaCount: created.criteria.length,
          },
          ...metadata,
        },
      });

      return created;
    });

    revalidatePath(`/organizations/${organizationId}/evaluation-templates`);
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
