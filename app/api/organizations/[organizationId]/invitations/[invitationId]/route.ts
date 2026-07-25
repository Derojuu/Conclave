import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { getRequestMetadata } from "@/lib/request-metadata";
import { ResourceNotFoundError } from "@/lib/security/errors";
import { requireCurrentOrganizationPermission } from "@/lib/security/rbac";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      organizationId: string;
      invitationId: string;
    }>;
  },
) {
  try {
    const { organizationId, invitationId } = await params;
    const { user } = await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.invitationsManage,
    );
    const metadata = await getRequestMetadata();

    await withTransaction(async (transaction) => {
      const revoked = await transaction.invitation.updateMany({
        where: {
          id: invitationId,
          organizationId,
          status: "PENDING",
        },
        data: { status: "REVOKED" },
      });

      if (revoked.count !== 1) {
        throw new ResourceNotFoundError("Pending invitation not found.");
      }

      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "REVOKE_INVITATION",
          entityType: "Invitation",
          entityId: invitationId,
          ...metadata,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
