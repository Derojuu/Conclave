import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganizationPermission } from "@/lib/security/rbac";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { organizationId } = await params;
    await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.membersRead,
    );
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      orderBy: [{ role: "asc" }, { user: { fullName: "asc" } }],
      select: {
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            walletAddress: true,
          },
        },
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    return apiError(error);
  }
}
