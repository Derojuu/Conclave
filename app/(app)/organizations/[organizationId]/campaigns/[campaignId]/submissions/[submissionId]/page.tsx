import type { Metadata } from "next";
import {
  CalendarClock,
  ExternalLink,
  FileCheck2,
  Link2,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";

import { SubmissionNavigation } from "@/components/submissions/submission-navigation";
import { SubmissionPageHeader } from "@/components/submissions/submission-page-header";
import { ORGANIZATION_PERMISSIONS, roleHasPermission } from "@/constants/auth";
import type { SubmissionStatus } from "@/constants/submission";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSubmissionPermission } from "@/lib/security/submission-rbac";

export const metadata: Metadata = {
  title: "Submission overview",
  robots: { index: false, follow: false },
};

function formatHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function SubmissionOverviewPage({
  params,
}: {
  params: Promise<{
    organizationId: string;
    campaignId: string;
    submissionId: string;
  }>;
}) {
  const { organizationId, campaignId, submissionId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}`,
  });
  const access = await requireSubmissionPermission(
    user.id,
    organizationId,
    campaignId,
    submissionId,
    ORGANIZATION_PERMISSIONS.submissionsRead,
  );
  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.submissionsManage);
  const submission = await prisma.submission.findUniqueOrThrow({
    where: { id: submissionId },
    select: {
      id: true,
      title: true,
      description: true,
      kind: true,
      metadata: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
        },
      },
      campaign: {
        select: {
          title: true,
          status: true,
          deadline: true,
          organization: { select: { name: true } },
        },
      },
      contributors: {
        orderBy: { member: { fullName: "asc" } },
        select: {
          createdAt: true,
          role: true,
          member: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      links: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          type: true,
          label: true,
          url: true,
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
      _count: {
        select: {
          contributors: true,
          evaluations: true,
          attachments: true,
        },
      },
    },
  });

  const stats = [
    {
      label: "Contributors",
      value: submission._count.contributors,
      icon: Users,
    },
    {
      label: "Evaluations",
      value: submission._count.evaluations,
      icon: FileCheck2,
    },
    {
      label: "Resources",
      value: submission.links.length + submission._count.attachments,
      icon: Link2,
    },
    {
      label: "Campaign status",
      value: submission.campaign.status.replaceAll("_", " "),
      icon: CalendarClock,
    },
  ];

  return (
    <div className="max-w-6xl">
      <SubmissionPageHeader
        campaignId={campaignId}
        campaignTitle={submission.campaign.title}
        description={submission.description}
        kind={submission.kind}
        organizationId={organizationId}
        status={submission.status as SubmissionStatus}
        title={submission.title}
      />
      <SubmissionNavigation
        canManage={canManage}
        campaignId={campaignId}
        organizationId={organizationId}
        submissionId={submissionId}
      />

      <section className="mt-8 grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 xl:grid-cols-4 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {stats.map((stat) => (
          <article className="bg-[#EBE8E1] p-5 dark:bg-[#111]" key={stat.label}>
            <stat.icon aria-hidden="true" className="text-zinc-500" size={17} />
            <p className="mt-7 text-2xl font-bold break-words text-zinc-950 uppercase dark:text-white">
              {stat.value}
            </p>
            <p className="mt-2 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              {stat.label}
            </p>
          </article>
        ))}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
        <section>
          <h2 className="border-b border-black/[0.06] pb-4 text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:border-white/[0.06] dark:text-white">
            Submission
          </h2>
          <div className="border-b border-black/[0.06] py-6 dark:border-white/[0.06]">
            <p className="text-[13px] leading-6 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
              {submission.description}
            </p>
          </div>
          <div className="grid gap-6 border-b border-black/[0.06] py-6 sm:grid-cols-2 dark:border-white/[0.06]">
            <div>
              <p className="text-[9px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
                Submission owner
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-indigo-500/10 text-[10px] font-bold text-indigo-500">
                  {submission.owner.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      src={submission.owner.avatar}
                    />
                  ) : (
                    submission.owner.fullName.slice(0, 2).toUpperCase()
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-zinc-950 dark:text-white">
                    {submission.owner.fullName}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-zinc-500">
                    {submission.owner.email}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
                Submission record
              </p>
              <p className="mt-3 text-[11px] text-zinc-950 dark:text-white">
                Created{" "}
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(submission.createdAt)}
              </p>
              <p className="mt-2 text-[10px] text-zinc-500">
                Last updated{" "}
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(submission.updatedAt)}
              </p>
            </div>
          </div>

          <div className="pt-8">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
              <h2 className="text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
                Contributors
              </h2>
              <Link
                className="text-[10px] font-bold text-indigo-500 uppercase"
                href={`/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/contributors`}
              >
                {canManage ? "Manage" : "View"} /{" "}
                {submission._count.contributors}
              </Link>
            </div>
            {submission.contributors.length ? (
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {submission.contributors.map(({ member, createdAt, role }) => (
                  <div className="flex items-center gap-3 py-4" key={member.id}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-indigo-500/10 text-[10px] font-bold text-indigo-500">
                      {member.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          src={member.avatar}
                        />
                      ) : (
                        member.fullName.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-zinc-950 dark:text-white">
                        {member.fullName}
                      </p>
                      <p className="mt-1 truncate text-[9px] text-zinc-500">
                        {member.email} / {role}
                      </p>
                    </div>
                    <time className="hidden text-[9px] text-zinc-500 uppercase sm:block">
                      Added{" "}
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                      }).format(createdAt)}
                    </time>
                  </div>
                ))}
              </div>
            ) : (
              <p className="border-b border-black/[0.06] py-8 text-[11px] text-zinc-500 dark:border-white/[0.06]">
                No contributors are assigned to this submission.
              </p>
            )}
          </div>
        </section>

        <aside>
          <h2 className="border-b border-black/[0.06] pb-4 text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:border-white/[0.06] dark:text-white">
            Submission links
          </h2>
          {submission.links.length ? (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {submission.links.map((resource) => (
                <a
                  className="group flex items-center gap-3 py-5"
                  href={resource.url}
                  key={resource.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-black/[0.06] text-zinc-500 group-hover:border-indigo-500 group-hover:text-indigo-500 dark:border-white/[0.06]">
                    <Link2 aria-hidden="true" size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-zinc-950 uppercase dark:text-white">
                      {resource.label}
                    </span>
                    <span className="mt-1 block truncate text-[10px] text-zinc-500">
                      {resource.type.replaceAll("_", " ")} /{" "}
                      {formatHost(resource.url)}
                    </span>
                  </span>
                  <ExternalLink
                    aria-hidden="true"
                    className="text-zinc-500 group-hover:text-indigo-500"
                    size={13}
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="border-b border-black/[0.06] py-8 text-[11px] text-zinc-500 dark:border-white/[0.06]">
              No links were added to this submission.
            </p>
          )}

          <div className="mt-8 border-y border-black/[0.06] py-6 dark:border-white/[0.06]">
            <p className="text-[9px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              Campaign
            </p>
            <p className="mt-3 text-[12px] font-bold text-zinc-950 uppercase dark:text-white">
              {submission.campaign.title}
            </p>
            <p className="mt-2 text-[10px] text-zinc-500">
              {submission.campaign.organization.name}
            </p>
            <p className="mt-5 flex items-center gap-2 text-[10px] text-zinc-500">
              <CalendarClock aria-hidden="true" size={12} />
              {submission.campaign.deadline
                ? new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(submission.campaign.deadline)
                : "No campaign deadline"}
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3 text-[10px] text-zinc-500">
            <UserRound aria-hidden="true" size={13} />
            Submission ID
            <span className="truncate font-mono text-zinc-950 dark:text-white">
              {submission.id}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
