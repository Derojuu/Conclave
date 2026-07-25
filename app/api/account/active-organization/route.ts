import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrganizationPermission } from "@/lib/security/rbac";
import { activeOrganizationSchema } from "@/lib/validation/auth";

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const input = activeOrganizationSchema.parse(await request.json());

    await requireOrganizationPermission(
      user.id,
      input.organizationId,
      ORGANIZATION_PERMISSIONS.read,
    );
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { activeOrganizationId: input.organizationId },
      create: {
        userId: user.id,
        activeOrganizationId: input.organizationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
