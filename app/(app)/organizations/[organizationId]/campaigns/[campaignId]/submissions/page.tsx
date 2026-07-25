import type { Metadata } from "next";
import {
  ArrowRight,
  FileCheck2,
  FolderKanban,
  Link2,
  Plus,
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
import { requireCampaignSubmissionPermission } from "@/lib/security/submission-rbac";

export const metadata: Metadata = {
  title: "Campaign submissions",
  robots: { index: false, follow: false },
};

export default async function CampaignSubmissionsPage({
  params,
}: {
  params: Promise<{ organizationId: string; campaignId: string }>;
}) {
  const { organizationId, campaignId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns/${campaignId}/submissions`,
  });
  const access = await requireCampaignSubmissionPermission(
    user.id,
    organizationId,
    campaignId,
    ORGANIZATION_PERMISSIONS.submissionsRead,
  );
  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.submissionsManage);
  const [campaign, submissions] = await Promise.all([
    prisma.evaluationCampaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: {
        title: true,
        description: true,
        status: true,
        organization: { select: { name: true } },
      },
    }),
    prisma.submission.findMany({
      where: { campaignId },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        kind: true,
        status: true,
        updatedAt: true,
        owner: {
          select: { fullName: true },
        },
        _count: {
          select: {
            contributors: true,
            evaluations: true,
            links: true,
          },
        },
      },
    }),
  ]);
  const mutable = campaign.status === "DRAFT" || campaign.status === "OPEN";
  const submittedCount = submissions.filter((submission) =>
    ["SUBMITTED", "IN_REVIEW"].includes(submission.status),
  ).length;
  const outcomeCount = submissions.filter((submission) =>
    ["SHORTLISTED", "SELECTED"].includes(submission.status),
  ).length;
  const teamAssignments = submissions.reduce(
    (total, submission) => total + submission._count.contributors,
    0,
  );

  const stats = [
    { label: "Submissions", value: submissions.length, icon: FolderKanban },
    { label: "In review", value: submittedCount, icon: FileCheck2 },
    { label: "Shortlisted", value: outcomeCount, icon: ArrowRight },
    { label: "Contributors", value: teamAssignments, icon: Users },
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

      <section className="mt-10">
        <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.06]">
          <div>
            <h2 className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
              Submissions
            </h2>
            <p className="mt-2 text-[9px] leading-5 text-zinc-500">
              Review every submission, its resources, contributors, and
              evaluation progress.
            </p>
          </div>
          {canManage && mutable ? (
            <Link
              className="button-primary inline-flex min-h-10 items-center justify-center gap-2 bg-zinc-950 px-4 text-[8px] font-bold tracking-[0.1em] uppercase dark:bg-white"
              href={`/organizations/${organizationId}/campaigns/${campaignId}/submissions/new`}
            >
              <Plus aria-hidden="true" size={13} />
              Add submission
            </Link>
          ) : canManage ? (
            <span className="text-[8px] font-bold tracking-[0.1em] text-amber-500 uppercase">
              Submissions locked
            </span>
          ) : null}
        </div>

        {submissions.length ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {submissions.map((submission) => {
              return (
                <Link
                  className="group grid gap-5 py-6 transition-colors sm:grid-cols-[1fr_auto] sm:items-center"
                  href={`/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submission.id}`}
                  key={submission.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <FolderKanban
                        aria-hidden="true"
                        className="text-zinc-500"
                        size={15}
                      />
                      <h3 className="text-[12px] font-bold text-zinc-950 uppercase group-hover:text-indigo-500 dark:text-white">
                        {submission.title}
                      </h3>
                      <SubmissionStatusBadge
                        status={submission.status as SubmissionStatus}
                      />
                    </div>
                    <p className="mt-3 line-clamp-2 max-w-3xl text-[9px] leading-5 text-zinc-500">
                      {submission.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[7px] tracking-[0.08em] text-zinc-500 uppercase">
                      {submission.kind ? <span>{submission.kind}</span> : null}
                      <span>
                        {submission._count.contributors} contributors
                      </span>
                      <span>{submission._count.evaluations} evaluations</span>
                      <span className="inline-flex items-center gap-1">
                        <Link2 aria-hidden="true" size={9} />
                        {submission._count.links} links
                      </span>
                      <span>Owned by {submission.owner.fullName}</span>
                      <span>
                        Updated{" "}
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                        }).format(submission.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="text-zinc-500 group-hover:text-indigo-500"
                    size={15}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center">
            <FolderKanban
              aria-hidden="true"
              className="mx-auto text-zinc-500"
              size={21}
            />
            <p className="mt-4 text-[10px] text-zinc-500">
              {canManage && mutable
                ? "Add the first submission to this campaign."
                : "No submissions are available."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
