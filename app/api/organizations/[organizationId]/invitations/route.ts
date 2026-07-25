import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { normalizeEmail, withTransaction } from "@/lib/database";
import {
  createInvitationToken,
  getInvitationUrl,
} from "@/lib/invitations";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { requireCurrentOrganizationPermission } from "@/lib/security/rbac";
import { invitationSchema } from "@/lib/validation/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { organizationId } = await params;
    await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.invitationsManage,
    );
    const invitations = await prisma.invitation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { organizationId } = await params;
    const { user } = await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.invitationsManage,
    );
    const input = invitationSchema.parse(await request.json());
    const email = normalizeEmail(input.email);
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        user: { email },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already an organization member." },
        { status: 409 },
      );
    }

    const token = createInvitationToken();
    const metadata = await getRequestMetadata();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await withTransaction(async (transaction) => {
      await transaction.invitation.updateMany({
        where: {
          organizationId,
          email,
          status: "PENDING",
        },
        data: { status: "REVOKED" },
      });

      const created = await transaction.invitation.create({
        data: {
          organizationId,
          email,
          role: input.role,
          tokenHash: token.tokenHash,
          invitedById: user.id,
          expiresAt,
        },
      });

      const invitedUser = await transaction.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (invitedUser) {
        await transaction.notification.create({
          data: {
            userId: invitedUser.id,
            type: "INVITATION",
            title: "Organization invitation",
            body: `You were invited to join an organization as ${input.role.toLowerCase()}.`,
            data: { invitationId: created.id, organizationId },
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          organizationId,
          actorId: user.id,
          action: "INVITE",
          entityType: "Invitation",
          entityId: created.id,
          metadata: { email, role: input.role },
          ...metadata,
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
        invitationUrl: getInvitationUrl(token.token),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
