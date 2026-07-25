import type { Metadata } from "next";
import {
  Activity,
  CheckCircle2,
  Cpu,
  FileCheck2,
  Hash,
  Link2,
  ShieldCheck,
} from "lucide-react";

import { CampaignNavigation } from "@/components/campaigns/campaign-navigation";
import { CampaignPageHeader } from "@/components/campaigns/campaign-page-header";
import { StartComputationButton } from "@/components/results/start-computation-button";
import { ORGANIZATION_PERMISSIONS, roleHasPermission } from "@/constants/auth";
import type { CampaignStatus } from "@/constants/campaign";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCampaignPermission } from "@/lib/security/campaign-rbac";
import { aggregateRankingEntrySchema } from "@/lib/validation/computation";
import { z } from "zod";

export const metadata: Metadata = {
  title: "Verified decision",
  robots: { index: false, follow: false },
};

export default async function CampaignResultsPage({
  params,
}: {
  params: Promise<{ organizationId: string; campaignId: string }>;
}) {
  const { organizationId, campaignId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/campaigns/${campaignId}/results`,
  });
  const access = await requireCampaignPermission(
    user.id,
    organizationId,
    campaignId,
    ORGANIZATION_PERMISSIONS.resultsRead,
  );
  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.campaignsManage);
  const canPublish =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.resultsPublish);
  const campaign = await prisma.evaluationCampaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: {
      title: true,
      description: true,
      status: true,
      organization: { select: { name: true } },
      submissions: {
        select: { id: true, title: true, kind: true },
      },
      evaluations: {
        where: { status: { in: ["SUBMITTED", "INCLUDED"] } },
        select: { id: true },
      },
      computationJobs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          providerTaskId: true,
          inputCommitment: true,
          resultCommitment: true,
          receiptHash: true,
          chainId: true,
          errorCode: true,
          errorMessage: true,
          createdAt: true,
          completedAt: true,
        },
      },
      result: {
        select: {
          status: true,
          decision: true,
          overallScore: true,
          ranking: true,
          summary: true,
          consensusSummary: true,
          statistics: true,
          providerTaskId: true,
          resultCommitment: true,
          transactionHash: true,
          computationJob: {
            select: {
              chainId: true,
              receiptHash: true,
            },
          },
          publishedAt: true,
          verifiedAt: true,
          selectedSubmissionId: true,
        },
      },
    },
  });
  const submissionById = new Map(
    campaign.submissions.map((submission) => [submission.id, submission]),
  );
  const rankingResult = z
    .array(aggregateRankingEntrySchema)
    .safeParse(campaign.result?.ranking);
  const ranking = rankingResult.success ? rankingResult.data : [];
  const statistics =
    campaign.result?.statistics &&
    typeof campaign.result.statistics === "object" &&
    !Array.isArray(campaign.result.statistics)
      ? Object.entries(campaign.result.statistics)
      : [];
  const activeJob = campaign.computationJobs.find((job) =>
    ["PENDING", "QUEUED", "RUNNING"].includes(job.status),
  );

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

      {campaign.result?.status === "VERIFIED" ? (
        <>
          <section className="mt-8 border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[8px] font-bold tracking-[0.12em] text-emerald-500 uppercase">
                  <ShieldCheck aria-hidden="true" size={14} />
                  Verified confidential decision
                </p>
                <h2 className="mt-4 text-2xl font-bold text-zinc-950 dark:text-white">
                  {campaign.result.decision}
                </h2>
                <p className="mt-4 max-w-3xl text-[10px] leading-6 text-zinc-600 dark:text-zinc-400">
                  {campaign.result.summary}
                </p>
              </div>
              {campaign.result.overallScore !== null ? (
                <div className="shrink-0 text-right">
                  <p className="text-4xl font-bold text-zinc-950 dark:text-white">
                    {Number(campaign.result.overallScore).toFixed(2)}
                  </p>
                  <p className="mt-2 text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
                    Aggregate score
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <div className="border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
                <h2 className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
                  Aggregate ranking
                </h2>
              </div>
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {ranking.map((entry) => {
                  const submission = submissionById.get(entry.submissionId);

                  return (
                    <div
                      className="grid grid-cols-[44px_1fr_auto] items-center gap-4 py-5"
                      key={entry.submissionId}
                    >
                      <span className="text-xl font-bold text-zinc-400">
                        {String(entry.rank).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-950 dark:text-white">
                          {submission?.title ?? "Unknown submission"}
                        </p>
                        {submission?.kind ? (
                          <p className="mt-1 text-[7px] text-zinc-500 uppercase">
                            {submission.kind}
                          </p>
                        ) : null}
                      </div>
                      <span className="font-mono text-[10px] text-zinc-950 dark:text-white">
                        {entry.score.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
                <h2 className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
                  Neutral consensus
                </h2>
              </div>
              <div className="py-6">
                <p className="text-[11px] leading-7 text-zinc-600 dark:text-zinc-400">
                  {campaign.result.consensusSummary}
                </p>
                <p className="mt-5 text-[7px] leading-4 text-zinc-500">
                  Generated inside the confidential computation from aggregate
                  feedback. No evaluator attribution or individual comments are
                  included.
                </p>
              </div>

              {statistics.length ? (
                <div className="mt-4 grid grid-cols-2 gap-px bg-black/[0.06] dark:bg-white/[0.06]">
                  {statistics.map(([label, value]) => (
                    <div className="bg-[#EBE8E1] p-4 dark:bg-[#111]" key={label}>
                      <p className="text-lg font-bold text-zinc-950 dark:text-white">
                        {String(value)}
                      </p>
                      <p className="mt-2 text-[7px] tracking-[0.08em] text-zinc-500 uppercase">
                        {label.replaceAll("_", " ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </div>

          <section className="mt-10 border-y border-black/[0.06] py-6 dark:border-white/[0.06]">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  label: "Nox task",
                  value: campaign.result.providerTaskId,
                  icon: Cpu,
                },
                {
                  label: "Network",
                  value: campaign.result.computationJob?.chainId
                    ? `Chain ${campaign.result.computationJob.chainId}`
                    : null,
                  icon: Link2,
                },
                {
                  label: "Computation receipt",
                  value: campaign.result.computationJob?.receiptHash,
                  icon: ShieldCheck,
                },
                {
                  label: "Result commitment",
                  value: campaign.result.resultCommitment,
                  icon: Hash,
                },
                {
                  label: "Transaction",
                  value: campaign.result.transactionHash,
                  icon: CheckCircle2,
                },
                {
                  label: "Included evaluations",
                  value: String(campaign.evaluations.length),
                  icon: FileCheck2,
                },
              ].map((item) => (
                <div key={item.label}>
                  <item.icon
                    aria-hidden="true"
                    className="text-zinc-500"
                    size={14}
                  />
                  <p className="mt-3 truncate font-mono text-[8px] text-zinc-950 dark:text-white">
                    {item.value ?? "Unavailable"}
                  </p>
                  <p className="mt-2 text-[7px] font-bold tracking-[0.08em] text-zinc-500 uppercase">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-8 border-y border-black/[0.06] py-10 dark:border-white/[0.06]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[8px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
                <Activity aria-hidden="true" size={14} />
                {activeJob
                  ? `Computation ${activeJob.status.toLowerCase()}`
                  : "No verified result"}
              </p>
              <p className="mt-3 max-w-2xl text-[10px] leading-6 text-zinc-500">
                {activeJob
                  ? "Encrypted evaluations are being processed by iExec Nox. Only the aggregate result will be published."
                  : "Start confidential computation after every assigned evaluator has submitted an encrypted assessment."}
              </p>
            </div>
            {canPublish && campaign.status === "EVALUATING" ? (
              <StartComputationButton
                campaignId={campaignId}
                organizationId={organizationId}
              />
            ) : null}
          </div>
        </section>
      )}

      {campaign.computationJobs.length ? (
        <section className="mt-10">
          <div className="border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
            <h2 className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
              Computation history
            </h2>
          </div>
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {campaign.computationJobs.map((job) => (
              <div
                className="grid gap-3 py-5 sm:grid-cols-[140px_1fr_auto]"
                key={job.id}
              >
                <p className="text-[8px] font-bold text-zinc-950 uppercase dark:text-white">
                  {job.status}
                </p>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[7px] text-zinc-500">
                    {job.providerTaskId ?? job.inputCommitment}
                  </p>
                  {job.receiptHash ? (
                    <p className="mt-2 truncate font-mono text-[7px] text-zinc-500">
                      Receipt {job.receiptHash}
                      {job.chainId ? ` · Chain ${job.chainId}` : ""}
                    </p>
                  ) : null}
                  {job.errorMessage ? (
                    <p className="mt-2 text-[8px] text-rose-500">
                      {job.errorCode}: {job.errorMessage}
                    </p>
                  ) : null}
                </div>
                <time className="text-[7px] text-zinc-500">
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(job.createdAt)}
                </time>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
