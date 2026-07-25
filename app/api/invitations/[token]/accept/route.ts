import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { withTransaction } from "@/lib/database";
import { hashInvitationToken } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  AuthorizationError,
  ConflictError,
  ResourceNotFoundError,
} from "@/lib/security/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const user = await requireApiUser();
    const tokenHash = hashInvitationToken(token);
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation) {
      throw new ResourceNotFoundError("Invitation not found.");
    }

    if (
      invitation.status === "ACCEPTED" &&
      invitation.acceptedById === user.id
    ) {
      return NextResponse.json({
        organizationId: invitation.organizationId,
      });
    }

    if (
      invitation.status !== "PENDING" ||
      invitation.expiresAt <= new Date()
    ) {
      throw new AuthorizationError(
        "This invitation is no longer available.",
      );
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new AuthorizationError(
        "The authenticated email does not match this invitation.",
      );
    }
    if (!["ADMIN", "EVALUATOR", "OBSERVER"].includes(invitation.role)) {
      throw new AuthorizationError(
        "This invitation contains an invalid organization role.",
      );
    }

    const metadata = await getRequestMetadata();
    await withTransaction(async (transaction) => {
      const accepted = await transaction.invitation.updateMany({
        where: {
          id: invitation.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        data: {
          status: "ACCEPTED",
          acceptedById: user.id,
          acceptedAt: new Date(),
        },
      });

      if (accepted.count !== 1) {
        throw new AuthorizationError(
          "This invitation has already been processed.",
        );
      }

      const existingMembership = await transaction.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: user.id,
          },
        },
        select: { role: true },
      });
      if (existingMembership) {
        throw new ConflictError(
          "You are already a member of this organization.",
        );
      }

      await transaction.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: invitation.role,
        },
      });
      await transaction.userSettings.upsert({
        where: { userId: user.id },
        update: { activeOrganizationId: invitation.organizationId },
        create: {
          userId: user.id,
          activeOrganizationId: invitation.organizationId,
        },
      });
      await transaction.auditLog.create({
        data: {
          organizationId: invitation.organizationId,
          actorId: user.id,
          action: "ACCEPT_INVITATION",
          entityType: "Invitation",
          entityId: invitation.id,
          metadata: { role: invitation.role },
          ...metadata,
        },
      });
    });

    return NextResponse.json({
      organizationId: invitation.organizationId,
    });
  } catch (error) {
    return apiError(error);
  }
}
