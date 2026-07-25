import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { ValidationError } from "@/lib/security/errors";
import { requireCurrentOrganizationPermission } from "@/lib/security/rbac";
import { removeSubmissionAttachmentObjects } from "@/lib/submission-attachments";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  organizationDeleteSchema,
  organizationUpdateSchema,
} from "@/lib/validation/auth";
import { ORGANIZATION_LOGO_BUCKET } from "@/utils/organization";

type OrganizationRouteContext = {
  params: Promise<{ organizationId: string }>;
};

export async function GET(
  _request: Request,
  { params }: OrganizationRouteContext,
) {
  try {
    const { organizationId } = await params;
    await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.read,
    );
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ organization });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: OrganizationRouteContext,
) {
  try {
    const { organizationId } = await params;
    const { user } = await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.update,
    );
    const input = organizationUpdateSchema.parse(await request.json());
    const metadata = await getRequestMetadata();

    const organization = await withTransaction(async (transaction) => {
      const updated = await transaction.organization.update({
        where: { id: organizationId },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description || null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
        },
      });

      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "Organization",
          entityId: organizationId,
          metadata: {
            name: input.name,
            slug: input.slug,
          },
          ...metadata,
        },
      });

      return updated;
    });

    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath(`/organizations/${organizationId}/settings`);
    return NextResponse.json({ organization });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: OrganizationRouteContext,
) {
  try {
    const { organizationId } = await params;
    const { user, organization } =
      await requireCurrentOrganizationPermission(
        organizationId,
        ORGANIZATION_PERMISSIONS.delete,
      );
    const input = organizationDeleteSchema.parse(await request.json());

    if (input.confirmation !== organization.slug) {
      throw new ValidationError(
        "Enter the organization slug exactly to confirm deletion.",
      );
    }

    const metadata = await getRequestMetadata();

    const deletedAssets = await withTransaction(async (transaction) => {
      const record = await transaction.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: {
          logoPath: true,
          campaigns: {
            select: {
              submissions: {
                select: {
                  attachments: {
                    select: { storagePath: true },
                  },
                },
              },
            },
          },
        },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "DELETE",
          entityType: "Organization",
          entityId: organizationId,
          metadata: { name: organization.name, slug: organization.slug },
          ...metadata,
        },
      });
      await transaction.organization.delete({
        where: { id: organizationId },
      });

      return {
        logoPath: record.logoPath,
        attachmentPaths: record.campaigns.flatMap((campaign) =>
          campaign.submissions.flatMap((submission) =>
            submission.attachments.map(
              (attachment) => attachment.storagePath,
            ),
          ),
        ),
      };
    });

    await removeSubmissionAttachmentObjects(
      deletedAssets.attachmentPaths,
      `organization ${organizationId}`,
    );

    if (deletedAssets.logoPath) {
      try {
        const { error } = await getSupabaseAdminClient()
          .storage.from(ORGANIZATION_LOGO_BUCKET)
          .remove([deletedAssets.logoPath]);
        if (error) {
          console.error(
            "Unable to remove deleted organization logo.",
            error,
          );
        }
      } catch (error) {
        console.error("Unable to remove deleted organization logo.", error);
      }
    }

    revalidatePath("/dashboard");
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
