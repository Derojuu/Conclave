import type { Metadata } from "next";
import {
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  FolderKanban,
  Users,
} from "lucide-react";
import Link from "next/link";

import { CampaignNavigation } from "@/components/campaigns/campaign-navigation";
import { CampaignPageHeader } from "@/components/campaigns/campaign-page-header";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-badge";
import { ORGANIZATION_PERMISSIONS, roleHasPermission } from "@/constants/auth";
import type { CampaignStatus } from "@/constants/campaign";
import type { SubmissionStatus } from "@/constants/submission";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCampaignPermission } from "@/lib/security/campaign-rbac";

export const metadata: Metadata = {
  title: "Campaign dashboard",
  robots: { index: false, follow: false },
};

export default async function CampaignDashboardPage({
  params,
}: {
  params: Promise<{ organizationId: string; campaignId: string }>;
}) {
  const { organizationId, campaignId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns/${campaignId}`,
  });
  const access = await requireCampaignPermission(
    user.id,
    organizationId,
    campaignId,
    ORGANIZATION_PERMISSIONS.campaignsRead,
  );
  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.campaignsManage);
  const [campaign, submittedEvaluations] = await Promise.all([
    prisma.evaluationCampaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        deadline: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: { name: true },
        },
        createdBy: {
          select: { fullName: true, email: true },
        },
        evaluationTemplate: {
          select: { title: true, version: true },
        },
        evaluators: {
          orderBy: { evaluator: { fullName: "asc" } },
          take: 6,
          select: {
            evaluator: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            title: true,
            description: true,
            kind: true,
            status: true,
            _count: {
              select: { evaluations: true },
            },
          },
        },
        result: {
          select: {
            status: true,
            publishedAt: true,
            resultCommitment: true,
          },
        },
        _count: {
          select: {
            evaluators: true,
            submissions: true,
            evaluations: true,
          },
        },
      },
    }),
    prisma.evaluation.count({
      where: {
        campaignId,
        status: { in: ["SUBMITTED", "INCLUDED"] },
      },
    }),
  ]);

  const stats = [
    {
      label: "Assigned evaluators",
      value: campaign._count.evaluators,
      icon: Users,
    },
    {
      label: "Submissions",
      value: campaign._count.submissions,
      icon: FolderKanban,
    },
    {
      label: "Evaluations",
      value: campaign._count.evaluations,
      icon: FileCheck2,
    },
    {
      label: "Submitted",
      value: submittedEvaluations,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="max-w-6xl">
      <CampaignPageHeader
        description={campaign.description}
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

      <section className="mt-8 grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 xl:grid-cols-4 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {stats.map((stat) => (
          <article className="bg-[#EBE8E1] p-5 dark:bg-[#111]" key={stat.label}>
            <stat.icon aria-hidden="true" className="text-zinc-500" size={17} />
            <p className="mt-7 text-3xl font-bold text-zinc-950 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-2 text-[8px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              {stat.label}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 border-y border-black/[0.06] py-6 sm:grid-cols-2 lg:grid-cols-4 dark:border-white/[0.06]">
        <div>
          <p className="text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Deadline
          </p>
          <p className="mt-2 flex items-center gap-2 text-[9px] text-zinc-950 dark:text-white">
            <CalendarClock aria-hidden="true" size={12} />
            {campaign.deadline
              ? new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(campaign.deadline)
              : "No deadline"}
          </p>
        </div>
        <div>
          <p className="text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Created by
          </p>
          <p className="mt-2 text-[9px] text-zinc-950 dark:text-white">
            {campaign.createdBy.fullName}
          </p>
        </div>
        <div>
          <p className="text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Evaluation template
          </p>
          <p className="mt-2 text-[9px] text-zinc-950 dark:text-white">
            {campaign.evaluationTemplate
              ? `${campaign.evaluationTemplate.title} / v${campaign.evaluationTemplate.version}`
              : "Not selected"}
          </p>
        </div>
        <div>
          <p className="text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Result
          </p>
          <p className="mt-2 text-[9px] text-zinc-950 dark:text-white">
            {campaign.result?.status ?? "Not computed"}
          </p>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
        <section>
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
            <h2 className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
              Submissions
            </h2>
            <Link
              className="text-[8px] font-bold text-indigo-500 uppercase"
              href={`/organizations/${organizationId}/campaigns/${campaignId}/submissions`}
            >
              View all / {campaign._count.submissions}
            </Link>
          </div>
          {campaign.submissions.length ? (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {campaign.submissions.map((submission) => (
                <Link
                  className="group block py-5"
                  href={`/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submission.id}`}
                  key={submission.id}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[11px] font-bold text-zinc-950 group-hover:text-indigo-500 dark:text-white">
                      {submission.title}
                    </p>
                    <SubmissionStatusBadge
                      status={submission.status as SubmissionStatus}
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[9px] leading-5 text-zinc-500">
                    {submission.description}
                  </p>
                  <p className="mt-3 text-[7px] text-zinc-500 uppercase">
                    {submission.kind
                      ? `${submission.kind} / `
                      : ""}
                    {submission._count.evaluations} evaluations
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="border-b border-black/[0.06] py-8 text-[9px] text-zinc-500 dark:border-white/[0.06]">
              No submissions have been added to this campaign.
            </p>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
            <h2 className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
              Evaluator roster
            </h2>
            <Link
              className="text-[8px] font-bold text-indigo-500 uppercase"
              href={`/organizations/${organizationId}/campaigns/${campaignId}/members`}
            >
              View all
            </Link>
          </div>
          {campaign.evaluators.length ? (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {campaign.evaluators.map(({ evaluator }) => (
                <div className="flex items-center gap-3 py-4" key={evaluator.id}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-indigo-500/10 text-[8px] font-bold text-indigo-500">
                    {evaluator.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={evaluator.avatar}
                      />
                    ) : (
                      evaluator.fullName.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[9px] font-bold text-zinc-950 dark:text-white">
                      {evaluator.fullName}
                    </p>
                    <p className="mt-1 truncate text-[7px] text-zinc-500">
                      {evaluator.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="border-b border-black/[0.06] py-8 text-[9px] text-zinc-500 dark:border-white/[0.06]">
              No evaluators assigned.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
