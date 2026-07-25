import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { ValidationError } from "@/lib/security/errors";
import { requireCurrentOrganizationPermission } from "@/lib/security/rbac";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ORGANIZATION_LOGO_BUCKET,
  ORGANIZATION_LOGO_MAX_BYTES,
  ORGANIZATION_LOGO_TYPES,
} from "@/utils/organization";

export const runtime = "nodejs";

type LogoRouteContext = {
  params: Promise<{ organizationId: string }>;
};

export async function POST(
  request: Request,
  { params }: LogoRouteContext,
) {
  try {
    const { organizationId } = await params;
    const { user } = await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.update,
    );
    const formData = await request.formData();
    const file = formData.get("logo");

    if (!(file instanceof File)) {
      throw new ValidationError("Select a logo image to upload.");
    }

    if (file.size <= 0 || file.size > ORGANIZATION_LOGO_MAX_BYTES) {
      throw new ValidationError(
        "Logo files must be smaller than 2 MB.",
      );
    }

    const extension =
      ORGANIZATION_LOGO_TYPES[
        file.type as keyof typeof ORGANIZATION_LOGO_TYPES
      ];

    if (!extension) {
      throw new ValidationError(
        "Logo files must be PNG, JPEG, or WebP.",
      );
    }

    const previous = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { logoPath: true },
    });
    const path = `${organizationId}/${randomUUID()}.${extension}`;
    const storage = getSupabaseAdminClient().storage.from(
      ORGANIZATION_LOGO_BUCKET,
    );
    const { error: uploadError } = await storage.upload(
      path,
      new Uint8Array(await file.arrayBuffer()),
      {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      },
    );

    if (uploadError) {
      throw new Error(`Logo upload failed: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = storage.getPublicUrl(path);

    try {
      const metadata = await getRequestMetadata();
      await withTransaction(async (transaction) => {
        await transaction.organization.update({
          where: { id: organizationId },
          data: {
            logo: publicUrl,
            logoPath: path,
          },
        });
        await transaction.auditLog.create({
          data: {
            organizationId,
            actorId: user.id,
            action: "UPDATE",
            entityType: "OrganizationLogo",
            entityId: organizationId,
            metadata: { path },
            ...metadata,
          },
        });
      });
    } catch (error) {
      await storage.remove([path]);
      throw error;
    }

    if (previous.logoPath) {
      const { error } = await storage.remove([previous.logoPath]);
      if (error) {
        console.error("Unable to remove previous organization logo.", error);
      }
    }

    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath(`/organizations/${organizationId}/settings`);
    return NextResponse.json({ logo: publicUrl });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: LogoRouteContext,
) {
  try {
    const { organizationId } = await params;
    const { user } = await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.update,
    );
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { logoPath: true },
    });
    const metadata = await getRequestMetadata();

    await withTransaction(async (transaction) => {
      await transaction.organization.update({
        where: { id: organizationId },
        data: { logo: null, logoPath: null },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "OrganizationLogo",
          entityId: organizationId,
          metadata: { removed: true },
          ...metadata,
        },
      });
    });

    if (organization.logoPath) {
      const { error } = await getSupabaseAdminClient()
        .storage.from(ORGANIZATION_LOGO_BUCKET)
        .remove([organization.logoPath]);
      if (error) {
        console.error("Unable to remove organization logo.", error);
      }
    }

    revalidatePath(`/organizations/${organizationId}`);
    revalidatePath(`/organizations/${organizationId}/settings`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
