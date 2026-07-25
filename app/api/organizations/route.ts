import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { withTransaction } from "@/lib/database";
import { getRequestMetadata } from "@/lib/request-metadata";
import { getAuthorizationContext } from "@/lib/security/rbac";
import { organizationSchema } from "@/lib/validation/auth";

export async function GET() {
  try {
    const user = await requireApiUser();
    const authorization = await getAuthorizationContext(user.id);
    return NextResponse.json({
      organizations: authorization.organizations,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = organizationSchema.parse(await request.json());
    const metadata = await getRequestMetadata();
    const organization = await withTransaction(async (transaction) => {
      const created = await transaction.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description || null,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          organizationId: created.id,
          actorId: user.id,
          action: "CREATE",
          entityType: "Organization",
          entityId: created.id,
          ...metadata,
        },
      });

      await transaction.userSettings.upsert({
        where: { userId: user.id },
        update: { activeOrganizationId: created.id },
        create: {
          userId: user.id,
          activeOrganizationId: created.id,
        },
      });

      return created;
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
