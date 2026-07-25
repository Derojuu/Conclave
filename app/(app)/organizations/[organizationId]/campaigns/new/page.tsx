import type { Metadata } from "next";

import { CampaignForm } from "@/components/campaigns/campaign-form";
import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrganizationPermission } from "@/lib/security/rbac";

export const metadata: Metadata = {
  title: "New campaign",
  robots: { index: false, follow: false },
};

export default async function NewCampaignPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns/new`,
  });
  const access = await requireOrganizationPermission(
    user.id,
    organizationId,
    ORGANIZATION_PERMISSIONS.campaignsManage,
  );
  const templates = await prisma.evaluationTemplate.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: "desc" }, { title: "asc" }, { version: "desc" }],
    select: { id: true, title: true, version: true },
  });

  return (
    <div className="max-w-3xl">
      <p className="text-[8px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
        {access.organization.slug} / campaign setup
      </p>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        Create campaign
      </h1>
      <p className="mt-4 max-w-2xl text-[11px] leading-6 text-zinc-500">
        New campaigns start in Draft so members, submissions, and evaluation rules
        can be configured before opening.
      </p>
      <section className="mt-10 border-y border-black/[0.06] py-8 dark:border-white/[0.06]">
        <CampaignForm organizationId={organizationId} templates={templates} />
      </section>
    </div>
  );
}
