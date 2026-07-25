import type { Metadata } from "next";

import { DeleteOrganization } from "@/components/organizations/delete-organization";
import { OrganizationForm } from "@/components/organizations/organization-form";
import { OrganizationLogoForm } from "@/components/organizations/organization-logo-form";
import { OrganizationNavigation } from "@/components/organizations/organization-navigation";
import {
  ORGANIZATION_PERMISSIONS,
  roleHasPermission,
} from "@/constants/auth";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrganizationPermission } from "@/lib/security/rbac";

export const metadata: Metadata = {
  title: "Organization settings",
  robots: { index: false, follow: false },
};

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/settings`,
  });
  const access = await requireOrganizationPermission(
    user.id,
    organizationId,
    ORGANIZATION_PERMISSIONS.update,
  );
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
    },
  });
  const canDelete =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.delete);

  return (
    <div className="max-w-4xl">
      <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
        {organization.slug} / configuration
      </p>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        Organization settings
      </h1>
      <p className="mt-4 max-w-2xl text-[13px] leading-6 text-zinc-500">
        Manage the organization profile, identity, and workspace lifecycle.
      </p>

      <OrganizationNavigation
        canManageSettings
        canReadAudit
        organizationId={organizationId}
      />

      <section className="mt-8 border-b border-black/[0.06] pb-8 dark:border-white/[0.06]">
        <OrganizationLogoForm
          logo={organization.logo}
          organizationId={organization.id}
          organizationName={organization.name}
        />
      </section>

      <section className="border-b border-black/[0.06] py-8 dark:border-white/[0.06]">
        <div className="mb-7">
          <p className="text-[12px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
            Organization profile
          </p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">
            Changes to the name, description, and slug appear across the
            workspace immediately.
          </p>
        </div>
        <OrganizationForm
          defaultValues={{
            name: organization.name,
            slug: organization.slug,
            description: organization.description ?? "",
          }}
          organizationId={organization.id}
        />
      </section>

      {canDelete ? (
        <section className="py-8">
          <DeleteOrganization
            organizationId={organization.id}
            organizationSlug={organization.slug}
          />
        </section>
      ) : null}
    </div>
  );
}
