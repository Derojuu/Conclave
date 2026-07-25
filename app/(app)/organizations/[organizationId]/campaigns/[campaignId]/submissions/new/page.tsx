import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { SubmissionForm } from "@/components/submissions/submission-form";
import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireCampaignSubmissionPermission } from "@/lib/security/submission-rbac";

export const metadata: Metadata = {
  title: "Add submission",
  robots: { index: false, follow: false },
};

export default async function NewSubmissionPage({
  params,
}: {
  params: Promise<{ organizationId: string; campaignId: string }>;
}) {
  const { organizationId, campaignId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns/${campaignId}/submissions/new`,
  });
  const access = await requireCampaignSubmissionPermission(
    user.id,
    organizationId,
    campaignId,
    ORGANIZATION_PERMISSIONS.submissionsManage,
  );
  const mutable =
    access.campaign.status === "DRAFT" || access.campaign.status === "OPEN";

  return (
    <div className="max-w-4xl">
      <Link
        className="inline-flex items-center gap-2 text-[8px] font-bold tracking-[0.1em] text-zinc-500 uppercase hover:text-indigo-500"
        href={`/organizations/${organizationId}/campaigns/${campaignId}/submissions`}
      >
        <ArrowLeft aria-hidden="true" size={12} />
        {access.campaign.title} submissions
      </Link>
      <p className="mt-7 text-[8px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
        {access.organization.slug} / submission submission
      </p>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        Add submission
      </h1>
      <p className="mt-4 max-w-2xl text-[11px] leading-6 text-zinc-500">
        Register the submission profile, category, source repository, demo, and
        presentation links for this campaign.
      </p>
      <section className="mt-10 border-y border-black/[0.06] py-8 dark:border-white/[0.06]">
        <SubmissionForm
          campaignId={campaignId}
          disabled={!mutable}
          organizationId={organizationId}
        />
      </section>
    </div>
  );
}
