import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { buildCriterionRecords } from "@/lib/evaluation-template";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  requireCurrentEvaluationTemplatePermission,
  requireEditableEvaluationTemplate,
} from "@/lib/security/evaluation-template-rbac";
import { ValidationError } from "@/lib/security/errors";
import {
  evaluationTemplateDeleteSchema,
  evaluationTemplateSchema,
} from "@/lib/validation/evaluation-template";

type EvaluationTemplateRouteContext = {
  params: Promise<{
    organizationId: string;
    templateId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: EvaluationTemplateRouteContext,
) {
  try {
    const { organizationId, templateId } = await params;
    await requireCurrentEvaluationTemplatePermission(
      organizationId,
      templateId,
      ORGANIZATION_PERMISSIONS.templatesRead,
    );
    const template = await prisma.evaluationTemplate.findUniqueOrThrow({
      where: { id: templateId },
      include: {
        criteria: {
          orderBy: { position: "asc" },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        campaigns: {
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: EvaluationTemplateRouteContext,
) {
  try {
    const { organizationId, templateId } = await params;
    const { user, template: existing } =
      await requireCurrentEvaluationTemplatePermission(
        organizationId,
        templateId,
        ORGANIZATION_PERMISSIONS.templatesManage,
      );
    requireEditableEvaluationTemplate(existing._count.campaigns);
    const input = evaluationTemplateSchema.parse(await request.json());
    const criteria = buildCriterionRecords(input.criteria);
    const metadata = await getRequestMetadata();

    const template = await withTransaction(async (transaction) => {
      if (input.isDefault) {
        await transaction.evaluationTemplate.updateMany({
          where: {
            organizationId,
            isDefault: true,
            id: { not: templateId },
          },
          data: { isDefault: false },
        });
      }

      const updated = await transaction.evaluationTemplate.update({
        where: { id: templateId },
        data: {
          title: input.title,
          description: input.description || null,
          instructions: input.instructions,
          deadline: input.deadline ? new Date(input.deadline) : null,
          isDefault: input.isDefault,
          criteria: {
            deleteMany: {},
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
          action: "UPDATE",
          entityType: "EvaluationTemplate",
          entityId: templateId,
          metadata: {
            autosave: true,
            title: updated.title,
            version: updated.version,
            criteriaCount: updated.criteria.length,
          },
          ...metadata,
        },
      });

      return updated;
    });

    revalidatePath(`/organizations/${organizationId}/evaluation-templates`);
    revalidatePath(
      `/organizations/${organizationId}/evaluation-templates/${templateId}`,
    );
    return NextResponse.json({ template });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: EvaluationTemplateRouteContext,
) {
  try {
    const { organizationId, templateId } = await params;
    const { user, template } = await requireCurrentEvaluationTemplatePermission(
      organizationId,
      templateId,
      ORGANIZATION_PERMISSIONS.templatesManage,
    );
    requireEditableEvaluationTemplate(template._count.campaigns);
    const input = evaluationTemplateDeleteSchema.parse(await request.json());
    const expectedConfirmation = `${template.title} v${template.version}`;

    if (input.confirmation !== expectedConfirmation) {
      throw new ValidationError(
        `Enter "${expectedConfirmation}" exactly to confirm deletion.`,
      );
    }

    const evaluationCount = await prisma.evaluation.count({
      where: {
        campaign: { evaluationTemplateId: templateId },
      },
    });

    if (evaluationCount > 0) {
      throw new ValidationError(
        "Templates used by recorded evaluations cannot be deleted.",
      );
    }

    const metadata = await getRequestMetadata();
    await withTransaction(async (transaction) => {
      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "DELETE",
          entityType: "EvaluationTemplate",
          entityId: templateId,
          metadata: {
            title: template.title,
            version: template.version,
          },
          ...metadata,
        },
      });
      await transaction.evaluationTemplate.delete({
        where: { id: templateId },
      });
    });

    revalidatePath(`/organizations/${organizationId}/evaluation-templates`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
