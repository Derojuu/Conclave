import type { Metadata } from "next";

import { SubmissionAttachmentsManager } from "@/components/submissions/submission-attachments-manager";
import { SubmissionNavigation } from "@/components/submissions/submission-navigation";
import { SubmissionPageHeader } from "@/components/submissions/submission-page-header";
import { ORGANIZATION_PERMISSIONS, roleHasPermission } from "@/constants/auth";
import type { SubmissionStatus } from "@/constants/submission";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSubmissionPermission } from "@/lib/security/submission-rbac";
import { createDownloadableAttachments } from "@/lib/submission-attachments";

export const metadata: Metadata = {
  title: "Submission attachments",
  robots: { index: false, follow: false },
};

export default async function SubmissionAttachmentsPage({
  params,
}: {
  params: Promise<{
    organizationId: string;
    campaignId: string;
    submissionId: string;
  }>;
}) {
  const { organizationId, campaignId, submissionId } = await params;
  const next = `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/attachments`;
  const user = await requireAuthenticatedUser({ next });
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
      title: true,
      kind: true,
      status: true,
      campaign: {
        select: {
          title: true,
          status: true,
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          storagePath: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
  });
  const attachments = await createDownloadableAttachments(
    submission.attachments,
  );
  const mutable =
    submission.campaign.status === "DRAFT" ||
    submission.campaign.status === "OPEN";

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
        <SubmissionAttachmentsManager
          attachments={attachments}
          campaignId={campaignId}
          canManage={canManage}
          mutable={mutable}
          organizationId={organizationId}
          submissionId={submissionId}
        />
      </section>
    </div>
  );
}
