import type { Metadata } from "next";
import { Clock3 } from "lucide-react";

import { CampaignNavigation } from "@/components/campaigns/campaign-navigation";
import { CampaignPageHeader } from "@/components/campaigns/campaign-page-header";
import {
  ORGANIZATION_PERMISSIONS,
  roleHasPermission,
} from "@/constants/auth";
import type { CampaignStatus } from "@/constants/campaign";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCampaignPermission } from "@/lib/security/campaign-rbac";

export const metadata: Metadata = {
  title: "Campaign timeline",
  robots: { index: false, follow: false },
};

function eventDescription(
  action: string,
  entityType: string,
  metadata: unknown,
) {
  if (
    entityType === "CampaignStatus" &&
    metadata &&
    typeof metadata === "object" &&
    "status" in metadata &&
    typeof metadata.status === "string"
  ) {
    return `Status changed to ${metadata.status.toLowerCase()}.`;
  }

  if (entityType === "CampaignEvaluator") {
    return action === "DELETE"
      ? "An evaluator was removed from the campaign."
      : "An evaluator was assigned to the campaign.";
  }

  if (entityType === "Campaign" && action === "UPDATE") {
    return "Campaign details were updated.";
  }

  if (entityType === "Evaluation") {
    return "A confidential evaluation was submitted.";
  }

  return `${entityType} ${action.toLowerCase()} event recorded.`;
}

export default async function CampaignTimelinePage({
  params,
}: {
  params: Promise<{ organizationId: string; campaignId: string }>;
}) {
  const { organizationId, campaignId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns/${campaignId}/timeline`,
  });
  const access = await requireCampaignPermission(
    user.id,
    organizationId,
    campaignId,
    ORGANIZATION_PERMISSIONS.campaignsRead,
  );
  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(
      access.role,
      ORGANIZATION_PERMISSIONS.campaignsManage,
    );
  const [campaign, events] = await Promise.all([
    prisma.evaluationCampaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: {
        title: true,
        status: true,
        createdAt: true,
        createdBy: { select: { fullName: true } },
        organization: { select: { name: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        action: true,
        entityType: true,
        metadata: true,
        createdAt: true,
        actor: {
          select: { fullName: true },
        },
      },
    }),
  ]);

  return (
    <div className="max-w-5xl">
      <CampaignPageHeader
        organizationId={organizationId}
        organizationName={campaign.organization.name}
        status={campaign.status as CampaignStatus}
        title={campaign.title}
      />
      <CampaignNavigation
        canManage={canManage}
        campaignId={campaignId}
        organizationId={organizationId}
      />

      <section className="mt-8">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
            Activity timeline
          </h2>
          <span className="text-[10px] text-zinc-500">
            {events.length + 1} EVENTS
          </span>
        </div>

        <ol className="relative border-l border-black/[0.08] pl-7 dark:border-white/[0.08]">
          {events.map((event) => (
            <li className="relative border-b border-black/[0.06] py-6 dark:border-white/[0.06]" key={event.id}>
              <span className="absolute top-7 -left-[31px] flex h-2 w-2 bg-indigo-500" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] font-bold text-zinc-950 dark:text-white">
                  {eventDescription(
                    event.action,
                    event.entityType,
                    event.metadata,
                  )}
                </p>
                <time className="shrink-0 text-[10px] text-zinc-500">
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(event.createdAt)}
                </time>
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">
              {event.entityType === "Evaluation"
                ? "Confidential evaluator"
                : (event.actor?.fullName ?? "System")}{" "}
              / {event.entityType}
              </p>
            </li>
          ))}
          <li className="relative py-6">
            <span className="absolute top-7 -left-[35px] flex h-4 w-4 items-center justify-center bg-[#F5F2EB] dark:bg-[#0a0a0a]">
              <Clock3
                aria-hidden="true"
                className="text-emerald-500"
                size={12}
              />
            </span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] font-bold text-zinc-950 dark:text-white">
                Campaign created.
              </p>
              <time className="shrink-0 text-[10px] text-zinc-500">
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(campaign.createdAt)}
              </time>
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">
              {campaign.createdBy.fullName} / Campaign
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}
