import "server-only";

import {
  ORGANIZATION_PERMISSIONS,
  roleHasPermission,
  type OrganizationPermission,
  type OrganizationRole,
} from "@/constants/auth";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/security/errors";

export type AuthorizationContext = {
  userId: string;
  isSuperAdmin: boolean;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: OrganizationRole;
    permissions: readonly OrganizationPermission[];
  }>;
};

export async function getAuthorizationContext(
  userId: string,
): Promise<AuthorizationContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      platformRole: true,
      memberships: {
        select: {
          role: true,
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { organization: { name: "asc" } },
      },
    },
  });

  if (!user) {
    throw new ResourceNotFoundError("User profile not found.");
  }

  return {
    userId,
    isSuperAdmin: user.platformRole === "SUPER_ADMIN",
    organizations: user.memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
      permissions: roleHasPermission(
        membership.role,
        ORGANIZATION_PERMISSIONS.read,
      )
        ? rolePermissionsFor(membership.role)
        : [],
    })),
  };
}

function rolePermissionsFor(role: OrganizationRole) {
  return Object.values(ORGANIZATION_PERMISSIONS).filter((permission) =>
    roleHasPermission(role, permission),
  );
}

export async function requireOrganizationPermission(
  userId: string,
  organizationId: string,
  permission: OrganizationPermission,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      platformRole: true,
      memberships: {
        where: { organizationId },
        select: { role: true },
        take: 1,
      },
    },
  });

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
    },
  });

  if (!organization) {
    throw new ResourceNotFoundError("Organization not found.");
  }

  if (user?.platformRole === "SUPER_ADMIN") {
    return { organization, role: "OWNER" as const, isSuperAdmin: true };
  }

  const role = user?.memberships[0]?.role;

  if (!role || !roleHasPermission(role, permission)) {
    throw new AuthorizationError();
  }

  return { organization, role, isSuperAdmin: false };
}

export async function requireCurrentOrganizationPermission(
  organizationId: string,
  permission: OrganizationPermission,
) {
  const user = await requireApiUser();
  const access = await requireOrganizationPermission(
    user.id,
    organizationId,
    permission,
  );

  return { user, ...access };
}

export async function requireSuperAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true },
  });

  if (!user) {
    throw new ResourceNotFoundError("User profile not found.");
  }
  if (user.platformRole !== "SUPER_ADMIN") {
    throw new AuthorizationError("Platform administration access is required.");
  }

  return { isSuperAdmin: true as const };
}
