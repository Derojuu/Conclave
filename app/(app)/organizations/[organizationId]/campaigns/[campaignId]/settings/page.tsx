import type { Metadata } from "next";

import { CampaignForm } from "@/components/campaigns/campaign-form";
import { CampaignNavigation } from "@/components/campaigns/campaign-navigation";
import { CampaignPageHeader } from "@/components/campaigns/campaign-page-header";
import { CampaignStatusControl } from "@/components/campaigns/campaign-status-control";
import { DeleteCampaign } from "@/components/campaigns/delete-campaign";
import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import type { CampaignStatus } from "@/constants/campaign";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCampaignPermission } from "@/lib/security/campaign-rbac";

export const metadata: Metadata = {
  title: "Campaign settings",
  robots: { index: false, follow: false },
};

export default async function CampaignSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string; campaignId: string }>;
}) {
  const { organizationId, campaignId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns/${campaignId}/settings`,
  });
  await requireCampaignPermission(
    user.id,
    organizationId,
    campaignId,
    ORGANIZATION_PERMISSIONS.campaignsManage,
  );
  const [campaign, templates] = await Promise.all([
    prisma.evaluationCampaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: {
        title: true,
        description: true,
        status: true,
        deadline: true,
        evaluationTemplateId: true,
        organization: { select: { name: true } },
      },
    }),
    prisma.evaluationTemplate.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: "desc" }, { title: "asc" }, { version: "desc" }],
      select: { id: true, title: true, version: true },
    }),
  ]);
  const status = campaign.status as CampaignStatus;

  return (
    <div className="max-w-4xl">
      <CampaignPageHeader
        organizationId={organizationId}
        organizationName={campaign.organization.name}
        status={status}
        title={campaign.title}
      />
      <CampaignNavigation
        canManage
        campaignId={campaignId}
        organizationId={organizationId}
      />

      <section className="mt-8 border-b border-black/[0.06] pb-8 dark:border-white/[0.06]">
        <CampaignStatusControl
          campaignId={campaignId}
          currentStatus={status}
          key={status}
          organizationId={organizationId}
        />
      </section>

      <section className="border-b border-black/[0.06] py-8 dark:border-white/[0.06]">
        <div className="mb-7">
          <p className="text-[12px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
            Campaign details
          </p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">
            Update the campaign profile, deadline, and evaluation template.
          </p>
        </div>
        <CampaignForm
          campaignId={campaignId}
          defaultValues={{
            title: campaign.title,
            description: campaign.description,
            deadline: campaign.deadline?.toISOString() ?? null,
            evaluationTemplateId: campaign.evaluationTemplateId,
          }}
          disabled={status !== "DRAFT"}
          organizationId={organizationId}
          templates={templates}
        />
      </section>

      <section className="py-8">
        <DeleteCampaign
          canDelete={status === "DRAFT" || status === "ARCHIVED"}
          campaignId={campaignId}
          campaignTitle={campaign.title}
          organizationId={organizationId}
        />
      </section>
    </div>
  );
}
