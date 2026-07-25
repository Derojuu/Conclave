import type { Metadata } from "next";

import { DeleteSubmission } from "@/components/submissions/delete-submission";
import { SubmissionForm } from "@/components/submissions/submission-form";
import { SubmissionNavigation } from "@/components/submissions/submission-navigation";
import { SubmissionPageHeader } from "@/components/submissions/submission-page-header";
import { SubmissionStatusControl } from "@/components/submissions/submission-status-control";
import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import type { SubmissionStatus } from "@/constants/submission";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSubmissionPermission } from "@/lib/security/submission-rbac";

export const metadata: Metadata = {
  title: "Submission settings",
  robots: { index: false, follow: false },
};

export default async function SubmissionSettingsPage({
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
    next: `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/settings`,
  });
  await requireSubmissionPermission(
    user.id,
    organizationId,
    campaignId,
    submissionId,
    ORGANIZATION_PERMISSIONS.submissionsManage,
  );
  const submission = await prisma.submission.findUniqueOrThrow({
    where: { id: submissionId },
    select: {
      title: true,
      description: true,
      kind: true,
      metadata: true,
      status: true,
      links: {
        orderBy: { position: "asc" },
        select: { type: true, label: true, url: true },
      },
      campaign: {
        select: {
          title: true,
          status: true,
        },
      },
    },
  });
  const status = submission.status as SubmissionStatus;
  const mutable =
    submission.campaign.status === "DRAFT" || submission.campaign.status === "OPEN";

  return (
    <div className="max-w-4xl">
      <SubmissionPageHeader
        campaignId={campaignId}
        campaignTitle={submission.campaign.title}
        kind={submission.kind}
        organizationId={organizationId}
        status={status}
        title={submission.title}
      />
      <SubmissionNavigation
        canManage
        campaignId={campaignId}
        organizationId={organizationId}
        submissionId={submissionId}
      />

      <section className="mt-8 border-b border-black/[0.06] pb-8 dark:border-white/[0.06]">
        <SubmissionStatusControl
          campaignId={campaignId}
          currentStatus={status}
          disabled={submission.campaign.status === "ARCHIVED"}
          key={status}
          organizationId={organizationId}
          submissionId={submissionId}
        />
      </section>

      <section className="border-b border-black/[0.06] py-8 dark:border-white/[0.06]">
        <div className="mb-7">
          <p className="text-[10px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
            Submission details
          </p>
          <p className="mt-2 text-[9px] leading-5 text-zinc-500">
            Update the submission profile and its external submission links.
          </p>
        </div>
        <SubmissionForm
          campaignId={campaignId}
          defaultValues={{
            title: submission.title,
            description: submission.description,
            kind: submission.kind ?? "",
            metadata:
              typeof submission.metadata === "object" &&
              submission.metadata !== null &&
              !Array.isArray(submission.metadata)
                ? Object.fromEntries(
                    Object.entries(submission.metadata).map(([key, value]) => [
                      key,
                      String(value),
                    ]),
                  )
                : {},
            links: submission.links,
          }}
          disabled={!mutable}
          organizationId={organizationId}
          submissionId={submissionId}
        />
      </section>

      <section className="py-8">
        <DeleteSubmission
          canDelete={mutable && (status === "DRAFT" || status === "ARCHIVED")}
          campaignId={campaignId}
          organizationId={organizationId}
          submissionId={submissionId}
          submissionTitle={submission.title}
        />
      </section>
    </div>
  );
}
