import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { siteUrl } from "@/lib/metadata";
import { submitNoxComputation } from "@/lib/nox/client";
import { sha256, stableStringify } from "@/lib/nox/integrity";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { requireCurrentCampaignPermission } from "@/lib/security/campaign-rbac";
import {
  ConflictError,
  ValidationError,
} from "@/lib/security/errors";

type ComputationsRouteContext = {
  params: Promise<{
    organizationId: string;
    campaignId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: ComputationsRouteContext,
) {
  try {
    const { organizationId, campaignId } = await params;
    await requireCurrentCampaignPermission(
      organizationId,
      campaignId,
      ORGANIZATION_PERMISSIONS.resultsRead,
    );
    const jobs = await prisma.computationJob.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        provider: true,
        providerTaskId: true,
        providerDealId: true,
        chainId: true,
        inputCommitment: true,
        resultCommitment: true,
        receiptHash: true,
        errorCode: true,
        errorMessage: true,
        queuedAt: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  _request: Request,
  { params }: ComputationsRouteContext,
) {
  let createdJobId: string | null = null;
  let campaignIdForRecovery: string | null = null;

  try {
    const { organizationId, campaignId } = await params;
    campaignIdForRecovery = campaignId;
    const { user, campaign: accessCampaign } =
      await requireCurrentCampaignPermission(
        organizationId,
        campaignId,
        ORGANIZATION_PERMISSIONS.resultsPublish,
      );

    if (accessCampaign.status !== "EVALUATING") {
      throw new ValidationError(
        "Confidential computation can only start from the evaluating state.",
      );
    }

    const campaign = await prisma.evaluationCampaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        deadline: true,
        evaluationTemplate: {
          select: {
            id: true,
            version: true,
            instructions: true,
            criteria: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                key: true,
                label: true,
                type: true,
                weight: true,
                minScore: true,
                maxScore: true,
              },
            },
          },
        },
        evaluators: {
          select: { userId: true },
        },
        submissions: {
          where: {
            status: {
              notIn: ["DRAFT", "WITHDRAWN", "ARCHIVED"],
            },
          },
          orderBy: { id: "asc" },
          select: {
            id: true,
            title: true,
            metadata: true,
          },
        },
        evaluations: {
          where: {
            status: "SUBMITTED",
          },
          orderBy: { id: "asc" },
          select: {
            id: true,
            submissionId: true,
            evaluatorId: true,
            payload: {
              select: {
                ciphertext: true,
                encryptedKey: true,
                encryptionAlgorithm: true,
                keyReference: true,
                nonce: true,
                additionalData: true,
                payloadHash: true,
                schemaVersion: true,
              },
            },
          },
        },
      },
    });

    if (!campaign.evaluationTemplate) {
      throw new ValidationError(
        "Select an evaluation template before starting computation.",
      );
    }

    if (!campaign.evaluators.length || !campaign.submissions.length) {
      throw new ValidationError(
        "At least one evaluator and one eligible submission are required.",
      );
    }

    const evaluatorIds = new Set(
      campaign.evaluators.map((evaluator) => evaluator.userId),
    );
    const submissionIds = new Set(
      campaign.submissions.map((submission) => submission.id),
    );
    const submittedByPair = new Map(
      campaign.evaluations
        .filter(
          (evaluation) =>
            evaluatorIds.has(evaluation.evaluatorId) &&
            submissionIds.has(evaluation.submissionId),
        )
        .map((evaluation) => [
          `${evaluation.submissionId}:${evaluation.evaluatorId}`,
          evaluation,
        ]),
    );
    const expectedPairs = campaign.submissions.flatMap((submission) =>
      campaign.evaluators.map(
        (evaluator) => `${submission.id}:${evaluator.userId}`,
      ),
    );
    const missingPairs = expectedPairs.filter(
      (pair) => !submittedByPair.has(pair),
    );
    const sealedEvaluations = expectedPairs
      .map((pair) => submittedByPair.get(pair))
      .filter(
        (
          evaluation,
        ): evaluation is (typeof campaign.evaluations)[number] =>
          evaluation !== undefined,
      );
    const expectedEvaluationCount =
      campaign.evaluators.length * campaign.submissions.length;
    if (missingPairs.length > 0) {
      throw new ValidationError(
        `${missingPairs.length} confidential evaluations are still outstanding.`,
      );
    }

    if (
      sealedEvaluations.some(
        (evaluation) =>
          !evaluation.payload || !evaluation.payload.additionalData,
      )
    ) {
      throw new ValidationError(
        "Every submitted evaluation must contain a sealed encrypted payload.",
      );
    }

    const activeJob = await prisma.computationJob.findFirst({
      where: {
        campaignId,
        status: { in: ["PENDING", "QUEUED", "RUNNING"] },
      },
      select: { id: true },
    });

    if (activeJob) {
      throw new ConflictError(
        "A confidential computation is already active for this campaign.",
      );
    }

    const payloadHashes = sealedEvaluations
      .map((evaluation) => evaluation.payload?.payloadHash ?? "")
      .sort();
    const inputCommitment = sha256(
      stableStringify({
        campaignId,
        templateId: campaign.evaluationTemplate.id,
        templateVersion: campaign.evaluationTemplate.version,
        submissionIds: campaign.submissions.map(
          (submission) => submission.id,
        ),
        payloadHashes,
      }),
    );
    const requestMetadata = await getRequestMetadata();
    const job = await withTransaction(async (transaction) => {
      const created = await transaction.computationJob.create({
        data: {
          campaignId,
          createdById: user.id,
          status: "PENDING",
          inputCommitment,
          requestMetadata: {
            schemaVersion: 1,
            evaluatorCount: campaign.evaluators.length,
            submissionCount: campaign.submissions.length,
            evaluationCount: expectedEvaluationCount,
          },
        },
      });
      await transaction.evaluationCampaign.update({
        where: { id: campaignId },
        data: { status: "COMPUTING" },
      });
      await transaction.decisionResult.upsert({
        where: { campaignId },
        update: {
          computationJobId: created.id,
          status: "COMPUTING",
        },
        create: {
          campaignId,
          computationJobId: created.id,
          status: "COMPUTING",
        },
      });
      await transaction.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "START_COMPUTATION",
          entityType: "ComputationJob",
          entityId: created.id,
          metadata: {
            inputCommitment,
            evaluationCount: expectedEvaluationCount,
          },
          ...requestMetadata,
        },
      });

      return created;
    });
    createdJobId = job.id;

    const providerRequest = {
      schemaVersion: 1 as const,
      jobId: job.id,
      inputCommitment,
      callbackUrl: `${siteUrl}/api/nox/computations/${job.id}/callback`,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        deadline: campaign.deadline?.toISOString() ?? null,
        template: {
          id: campaign.evaluationTemplate.id,
          version: campaign.evaluationTemplate.version,
          instructions: campaign.evaluationTemplate.instructions,
          criteria: campaign.evaluationTemplate.criteria.map(
            (criterion) => ({
              ...criterion,
              weight: Number(criterion.weight),
              minScore: Number(criterion.minScore),
              maxScore: Number(criterion.maxScore),
            }),
          ),
        },
      },
      submissions: campaign.submissions,
      encryptedEvaluations: sealedEvaluations.map((evaluation) => {
        const payload = evaluation.payload!;

        return {
          evaluationRef: sha256(
            `${campaignId}:${evaluation.id}:${payload.payloadHash}`,
          ),
          submissionId: evaluation.submissionId,
          ciphertext: payload.ciphertext,
          encryptedKey: payload.encryptedKey,
          encryptionAlgorithm: payload.encryptionAlgorithm,
          keyReference: payload.keyReference,
          nonce: payload.nonce,
          additionalData: payload.additionalData!,
          payloadHash: payload.payloadHash,
          schemaVersion: payload.schemaVersion,
        };
      }),
    };
    const providerJob = await submitNoxComputation(providerRequest);
    await prisma.computationJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: {
        status: providerJob.status,
        providerTaskId: providerJob.providerTaskId,
        providerDealId: providerJob.providerDealId,
        chainId: providerJob.chainId,
        appAddress: providerJob.appAddress?.toLowerCase(),
        workerpoolAddress: providerJob.workerpoolAddress?.toLowerCase(),
        queuedAt: new Date(),
        startedAt:
          providerJob.status === "RUNNING" ? new Date() : undefined,
      },
    });
    const updated = await prisma.computationJob.findUniqueOrThrow({
      where: { id: job.id },
      select: {
        id: true,
        status: true,
        providerTaskId: true,
        inputCommitment: true,
      },
    });

    return NextResponse.json({ job: updated }, { status: 202 });
  } catch (error) {
    if (createdJobId && campaignIdForRecovery) {
      const terminalJob = await withTransaction(async (transaction) => {
        const failed = await transaction.computationJob.updateMany({
          where: {
            id: createdJobId!,
            status: { in: ["PENDING", "QUEUED", "RUNNING"] },
          },
          data: {
            status: "FAILED",
            errorCode: "GATEWAY_SUBMISSION_FAILED",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Nox gateway submission failed.",
            completedAt: new Date(),
          },
        });
        if (failed.count !== 1) {
          return transaction.computationJob.findUnique({
            where: { id: createdJobId! },
            select: {
              id: true,
              status: true,
              providerTaskId: true,
              inputCommitment: true,
            },
          });
        }
        await transaction.evaluationCampaign.update({
          where: { id: campaignIdForRecovery! },
          data: { status: "EVALUATING" },
        });
        await transaction.decisionResult.updateMany({
          where: {
            campaignId: campaignIdForRecovery!,
            computationJobId: createdJobId!,
          },
          data: { status: "FAILED" },
        });
        return null;
      });

      if (terminalJob?.status === "SUCCEEDED") {
        return NextResponse.json({ job: terminalJob });
      }
    }

    return apiError(error);
  }
}
