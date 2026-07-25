import type { Metadata } from "next";

import { SubmissionNavigation } from "@/components/submissions/submission-navigation";
import { SubmissionPageHeader } from "@/components/submissions/submission-page-header";
import { SubmissionContributorsManager } from "@/components/submissions/submission-contributors-manager";
import { ORGANIZATION_PERMISSIONS, roleHasPermission } from "@/constants/auth";
import type { SubmissionStatus } from "@/constants/submission";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSubmissionPermission } from "@/lib/security/submission-rbac";

export const metadata: Metadata = {
  title: "Submission contributors",
  robots: { index: false, follow: false },
};

export default async function SubmissionContributorsPage({
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
    next: `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/contributors`,
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
  const [submission, members] = await Promise.all([
    prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      select: {
        title: true,
        description: true,
        kind: true,
        status: true,
        campaign: {
          select: {
            title: true,
            status: true,
          },
        },
      },
    }),
    prisma.submissionContributor.findMany({
      where: { submissionId },
      orderBy: { member: { fullName: "asc" } },
      select: {
        createdAt: true,
        member: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        addedBy: {
          select: { fullName: true },
        },
      },
    }),
  ]);
  const candidateRecords = canManage
    ? await prisma.organizationMember.findMany({
        where: {
          organizationId,
          user: {
            submissionContributions: {
              none: { submissionId },
            },
          },
        },
        orderBy: { user: { fullName: "asc" } },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
        },
      })
    : [];
  const mutable =
    submission.campaign.status === "DRAFT" || submission.campaign.status === "OPEN";

  return (
    <div className="max-w-5xl">
      <SubmissionPageHeader
        campaignId={campaignId}
        campaignTitle={submission.campaign.title}
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
      <section className="mt-8 border-y border-black/[0.06] py-8 dark:border-white/[0.06]">
        <SubmissionContributorsManager
          candidates={candidateRecords.map((record) => ({
            ...record.user,
            role: record.role,
          }))}
          canManage={canManage}
          campaignId={campaignId}
          members={members.map((assignment) => ({
            ...assignment.member,
            joinedAt: assignment.createdAt.toISOString(),
            addedBy: assignment.addedBy?.fullName ?? null,
          }))}
          mutable={mutable}
          organizationId={organizationId}
          submissionId={submissionId}
        />
      </section>
    </div>
  );
}
