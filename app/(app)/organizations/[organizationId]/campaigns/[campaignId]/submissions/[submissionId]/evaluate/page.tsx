import type { Metadata } from "next";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { ConfidentialEvaluationForm } from "@/components/evaluations/confidential-evaluation-form";
import { getEvaluationEncryptionConfig } from "@/lib/confidential/encryption-config";
import { getEvaluatorReference } from "@/lib/confidential/evaluator-reference";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireEvaluationAssignment } from "@/lib/security/evaluation-rbac";

export const metadata: Metadata = {
  title: "Confidential evaluation",
  robots: { index: false, follow: false },
};

export default async function EvaluateSubmissionPage({
  params,
}: {
  params: Promise<{
    organizationId: string;
    campaignId: string;
    submissionId: string;
  }>;
}) {
  const { organizationId, campaignId, submissionId } = await params;
  const next = `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/evaluate`;
  const user = await requireAuthenticatedUser({ next });
  await requireEvaluationAssignment(
    user.id,
    organizationId,
    campaignId,
    submissionId,
  );
  const [campaign, submission, existingEvaluation] = await Promise.all([
    prisma.evaluationCampaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: {
        title: true,
        status: true,
        deadline: true,
        organization: { select: { name: true } },
        evaluationTemplate: {
          select: {
            id: true,
            title: true,
            instructions: true,
            version: true,
            deadline: true,
            criteria: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                key: true,
                label: true,
                description: true,
                type: true,
                weight: true,
                minScore: true,
                maxScore: true,
              },
            },
          },
        },
      },
    }),
    prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      select: {
        title: true,
        description: true,
        kind: true,
        links: {
          orderBy: { position: "asc" },
          select: { id: true, label: true, url: true, type: true },
        },
      },
    }),
    prisma.evaluation.findUnique({
      where: {
        submissionId_evaluatorId: {
          submissionId,
          evaluatorId: user.id,
        },
      },
      select: {
        status: true,
        submittedAt: true,
        payload: {
          select: { payloadHash: true },
        },
      },
    }),
  ]);
  const template = campaign.evaluationTemplate;

  if (!template) {
    throw new Error("Campaign evaluation template is missing.");
  }

  const encryptionConfig = getEvaluationEncryptionConfig();
  const evaluatorRef = getEvaluatorReference(campaignId, user.id);

  return (
    <div className="max-w-5xl">
      <header>
        <Link
          className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase hover:text-indigo-500"
          href="/evaluations"
        >
          <ArrowLeft aria-hidden="true" size={12} />
          Evaluation workspace
        </Link>
        <div className="mt-6 flex flex-col gap-5 border-b border-black/[0.06] pb-7 sm:flex-row sm:items-start sm:justify-between dark:border-white/[0.06]">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-indigo-500 uppercase">
              {campaign.organization.name} / {campaign.title}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-zinc-950 sm:text-4xl dark:text-white">
              {submission.title}
            </h1>
            <p className="mt-4 max-w-3xl text-[12px] leading-6 text-zinc-500">
              {submission.description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2 text-[10px] font-bold text-emerald-500 uppercase">
            <LockKeyhole aria-hidden="true" size={13} />
            Browser encrypted
          </div>
        </div>
      </header>

      <section className="mt-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              {template.title} / Version {template.version}
            </p>
            <p className="mt-2 text-[10px] text-zinc-500">
              {template.criteria.length} criteria / Campaign{" "}
              {campaign.status.toLowerCase()}
            </p>
          </div>
          <p className="text-[9px] text-zinc-500">
            Deadline:{" "}
            {campaign.deadline
              ? new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(campaign.deadline)
              : "Not set"}
          </p>
        </div>

        <ConfidentialEvaluationForm
          campaignId={campaignId}
          encryptionConfig={
            encryptionConfig
              ? {
                  publicKey: encryptionConfig.publicKey,
                  keyReference: encryptionConfig.keyReference,
                }
              : null
          }
          evaluatorRef={evaluatorRef}
          existingEvaluation={
            existingEvaluation
              ? {
                  status: existingEvaluation.status,
                  payloadHash:
                    existingEvaluation.payload?.payloadHash ?? null,
                  submittedAt:
                    existingEvaluation.submittedAt?.toISOString() ?? null,
                }
              : null
          }
          organizationId={organizationId}
          submissionId={submissionId}
          template={{
            id: template.id,
            version: template.version,
            instructions: template.instructions,
            criteria: template.criteria.map((criterion) => ({
              ...criterion,
              weight: Number(criterion.weight),
              minScore: Number(criterion.minScore),
              maxScore: Number(criterion.maxScore),
            })),
          }}
        />
      </section>
    </div>
  );
}
