import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { requireCurrentEvaluationTemplatePermission } from "@/lib/security/evaluation-template-rbac";

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      organizationId: string;
      templateId: string;
    }>;
  },
) {
  try {
    const { organizationId, templateId } = await params;
    const { user } = await requireCurrentEvaluationTemplatePermission(
      organizationId,
      templateId,
      ORGANIZATION_PERMISSIONS.templatesManage,
    );
    const source = await prisma.evaluationTemplate.findUniqueOrThrow({
      where: { id: templateId },
      include: {
        criteria: {
          orderBy: { position: "asc" },
        },
      },
    });
    const latest = await prisma.evaluationTemplate.aggregate({
      where: {
        organizationId,
        title: source.title,
      },
      _max: { version: true },
    });
    const nextVersion = (latest._max.version ?? source.version) + 1;
    const metadata = await getRequestMetadata();

    const template = await withTransaction(async (transaction) => {
      const created = await transaction.evaluationTemplate.create({
        data: {
          organizationId,
          title: source.title,
          description: source.description,
          instructions: source.instructions,
          deadline: source.deadline,
          version: nextVersion,
          isDefault: false,
          createdById: user.id,
          criteria: {
            create: source.criteria.map((criterion) => ({
              key: criterion.key,
              label: criterion.label,
              description: criterion.description,
              type: criterion.type,
              weight: criterion.weight,
              minScore: criterion.minScore,
              maxScore: criterion.maxScore,
              position: criterion.position,
            })),
          },
        },
        select: { id: true, title: true, version: true },
      });

      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "CREATE",
          entityType: "EvaluationTemplateVersion",
          entityId: created.id,
          metadata: {
            sourceTemplateId: templateId,
            title: created.title,
            version: created.version,
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
