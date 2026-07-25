import type { Metadata } from "next";

import { MembersManager } from "@/components/organizations/members-manager";
import { OrganizationNavigation } from "@/components/organizations/organization-navigation";
import {
  ORGANIZATION_PERMISSIONS,
  roleHasPermission,
} from "@/constants/auth";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrganizationPermission } from "@/lib/security/rbac";

export const metadata: Metadata = {
  title: "Organization members",
  robots: { index: false, follow: false },
};

export default async function OrganizationMembersPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/members`,
  });
  const access = await requireOrganizationPermission(
    user.id,
    organizationId,
    ORGANIZATION_PERMISSIONS.membersRead,
  );

  await prisma.invitation.updateMany({
    where: {
      organizationId,
      status: "PENDING",
      expiresAt: { lte: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { user: { fullName: "asc" } }],
      },
      invitations: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(
      access.role,
      ORGANIZATION_PERMISSIONS.membersManage,
    );
  const canManageSettings =
    access.isSuperAdmin ||
    roleHasPermission(
      access.role,
      ORGANIZATION_PERMISSIONS.update,
    );

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 bg-emerald-500" />
        <p className="text-[8px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
          {organization.slug} / access control
        </p>
      </div>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        {organization.name}
      </h1>
      <p className="mt-4 max-w-2xl text-[11px] leading-6 text-zinc-500">
        Manage organization owners, administrators, evaluators, and pending
        invitations.
      </p>

      <OrganizationNavigation
        canManageSettings={canManageSettings}
        canReadAudit={canManageSettings}
        organizationId={organizationId}
      />

      <section className="mt-8 border-y border-black/[0.06] py-8 dark:border-white/[0.06]">
        <MembersManager
          canManage={canManage}
          currentUserId={user.id}
          invitations={organization.invitations.map((invitation) => ({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt.toISOString(),
          }))}
          members={organization.members.map((membership) => ({
            userId: membership.user.id,
            fullName: membership.user.fullName,
            email: membership.user.email,
            avatar: membership.user.avatar,
            role: membership.role,
          }))}
          organizationId={organization.id}
        />
      </section>
    </div>
  );
}
