import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError,
} from "@/lib/security/errors";
import { requireCurrentOrganizationPermission } from "@/lib/security/rbac";
import { membershipRoleSchema } from "@/lib/validation/auth";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ organizationId: string; userId: string }>;
  },
) {
  try {
    const { organizationId, userId } = await params;
    const { user } = await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.membersManage,
    );
    const input = membershipRoleSchema.parse(await request.json());
    const metadata = await getRequestMetadata();

    await withTransaction(async (transaction) => {
      const membership = await transaction.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId },
        },
      });

      if (!membership) {
        throw new ResourceNotFoundError("Organization member not found.");
      }

      if (membership.role === "OWNER") {
        throw new AuthorizationError("The organization owner role is immutable.");
      }

      if (membership.role === "EVALUATOR" && input.role !== "EVALUATOR") {
        const lockedAssignment = await transaction.campaignEvaluator.findFirst({
          where: {
            userId,
            campaign: {
              organizationId,
              status: { notIn: ["DRAFT", "OPEN"] },
            },
          },
          select: { campaignId: true },
        });
        if (lockedAssignment) {
          throw new ValidationError(
            "This evaluator is assigned to a campaign with a locked roster.",
          );
        }
        await transaction.campaignEvaluator.deleteMany({
          where: {
            userId,
            campaign: { organizationId },
          },
        });
      }

      await transaction.organizationMember.update({
        where: {
          organizationId_userId: { organizationId, userId },
        },
        data: { role: input.role },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "OrganizationMember",
          entityId: userId,
          metadata: { role: input.role },
          ...metadata,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ organizationId: string; userId: string }>;
  },
) {
  try {
    const { organizationId, userId } = await params;
    const { user } = await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.membersManage,
    );

    if (user.id === userId) {
      throw new AuthorizationError(
        "Administrators cannot remove their own membership.",
      );
    }

    const metadata = await getRequestMetadata();
    await withTransaction(async (transaction) => {
      const membership = await transaction.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId },
        },
      });

      if (!membership) {
        throw new ResourceNotFoundError("Organization member not found.");
      }

      if (membership.role === "OWNER") {
        throw new AuthorizationError("The organization owner cannot be removed.");
      }

      const lockedAssignment = await transaction.campaignEvaluator.findFirst({
        where: {
          userId,
          campaign: {
            organizationId,
            status: { notIn: ["DRAFT", "OPEN"] },
          },
        },
        select: { campaignId: true },
      });
      if (lockedAssignment) {
        throw new ValidationError(
          "This member is assigned to a campaign with a locked evaluator roster.",
        );
      }

      await transaction.campaignEvaluator.deleteMany({
        where: {
          userId,
          campaign: { organizationId },
        },
      });

      await transaction.organizationMember.delete({
        where: {
          organizationId_userId: { organizationId, userId },
        },
      });
      await transaction.userSettings.updateMany({
        where: {
          userId,
          activeOrganizationId: organizationId,
        },
        data: { activeOrganizationId: null },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "DELETE",
          entityType: "OrganizationMember",
          entityId: userId,
          ...metadata,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
