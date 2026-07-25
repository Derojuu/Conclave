import "server-only";

import type {
  ORGANIZATION_PERMISSIONS,
  OrganizationPermission,
} from "@/constants/auth";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResourceNotFoundError, ValidationError } from "@/lib/security/errors";
import { requireOrganizationPermission } from "@/lib/security/rbac";

type TemplatePermission =
  | typeof ORGANIZATION_PERMISSIONS.templatesRead
  | typeof ORGANIZATION_PERMISSIONS.templatesManage;

export async function requireEvaluationTemplatePermission(
  userId: string,
  organizationId: string,
  templateId: string,
  permission: TemplatePermission,
) {
  const template = await prisma.evaluationTemplate.findFirst({
    where: { id: templateId, organizationId },
    select: {
      id: true,
      title: true,
      version: true,
      isDefault: true,
      _count: {
        select: { campaigns: true },
      },
    },
  });

  if (!template) {
    throw new ResourceNotFoundError("Evaluation template not found.");
  }

  const access = await requireOrganizationPermission(
    userId,
    organizationId,
    permission as OrganizationPermission,
  );

  return { template, ...access };
}

export async function requireCurrentEvaluationTemplatePermission(
  organizationId: string,
  templateId: string,
  permission: TemplatePermission,
) {
  const user = await requireApiUser();
  const access = await requireEvaluationTemplatePermission(
    user.id,
    organizationId,
    templateId,
    permission,
  );

  return { user, ...access };
}

export function requireEditableEvaluationTemplate(
  assignedCampaignCount: number,
) {
  if (assignedCampaignCount > 0) {
    throw new ValidationError(
      "This template version is in use. Create a new version to make changes.",
    );
  }
}
