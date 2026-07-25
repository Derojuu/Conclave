import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import { sha256, stableStringify, verifyNoxCallbackSignature } from "@/lib/nox/integrity";
import { prisma } from "@/lib/prisma";
import {
  AuthenticationError,
  ConflictError,
  ResourceNotFoundError,
  ValidationError,
} from "@/lib/security/errors";
import { noxComputationCallbackSchema } from "@/lib/validation/computation";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ jobId: string }>;
  },
) {
  try {
    const { jobId } = await params;
    const rawBody = await request.text();
    const signatureValid = verifyNoxCallbackSignature({
      body: rawBody,
      timestamp: request.headers.get("x-conclave-timestamp"),
      signature: request.headers.get("x-conclave-signature"),
    });

    if (!signatureValid) {
      throw new AuthenticationError("Invalid Nox callback signature.");
    }

    const input = noxComputationCallbackSchema.parse(JSON.parse(rawBody));
    const job = await prisma.computationJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        campaignId: true,
        providerTaskId: true,
        campaign: {
          select: {
            organizationId: true,
            title: true,
            submissions: {
              where: {
                status: {
                  notIn: ["DRAFT", "WITHDRAWN", "ARCHIVED"],
                },
              },
              select: { id: true },
            },
            evaluators: {
              select: { userId: true },
            },
            organization: {
              select: {
                members: {
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new ResourceNotFoundError("Computation job not found.");
    }

    if (job.status === "SUCCEEDED" || job.status === "FAILED") {
      return NextResponse.json({
        received: true,
        idempotent: true,
        status: job.status,
      });
    }
    if (job.status === "CANCELLED") {
      throw new ConflictError(
        "This computation job was cancelled and cannot accept callbacks.",
      );
    }

    if (
      job.providerTaskId &&
      input.providerTaskId &&
      job.providerTaskId !== input.providerTaskId
    ) {
      throw new ConflictError(
        "Nox callback task ID does not match this computation job.",
      );
    }

    if (input.status === "FAILED") {
      await withTransaction(async (transaction) => {
        const failed = await transaction.computationJob.updateMany({
          where: {
            id: job.id,
            status: { in: ["PENDING", "QUEUED", "RUNNING"] },
          },
          data: {
            status: "FAILED",
            providerTaskId: input.providerTaskId ?? job.providerTaskId,
            errorCode: input.errorCode,
            errorMessage: input.errorMessage,
            completedAt: new Date(),
          },
        });
        if (failed.count !== 1) {
          throw new ConflictError(
            "The computation job was completed by another callback.",
          );
        }
        await transaction.evaluationCampaign.update({
          where: { id: job.campaignId },
          data: { status: "EVALUATING" },
        });
        await transaction.decisionResult.updateMany({
          where: {
            campaignId: job.campaignId,
            computationJobId: job.id,
          },
          data: { status: "FAILED" },
        });
        await transaction.auditLog.create({
          data: {
            organizationId: job.campaign.organizationId,
            campaignId: job.campaignId,
            action: "COMPLETE_COMPUTATION",
            entityType: "ComputationJob",
            entityId: job.id,
            metadata: {
              status: "FAILED",
              errorCode: input.errorCode,
            },
          },
        });
      });

      return NextResponse.json({ received: true, status: "FAILED" });
    }

    const submissionIds = new Set(
      job.campaign.submissions.map((submission) => submission.id),
    );
    const rankedSubmissionIds = new Set<string>();
    const ranks = new Set<number>();

    for (const entry of input.result.ranking) {
      if (!submissionIds.has(entry.submissionId)) {
        throw new ValidationError(
          "The aggregate ranking contains an unknown submission.",
        );
      }
      if (
        rankedSubmissionIds.has(entry.submissionId) ||
        ranks.has(entry.rank)
      ) {
        throw new ValidationError(
          "The aggregate ranking contains duplicate submissions or ranks.",
        );
      }
      rankedSubmissionIds.add(entry.submissionId);
      ranks.add(entry.rank);
    }

    const sortedRanks = [...ranks].sort((left, right) => left - right);
    if (sortedRanks.some((rank, index) => rank !== index + 1)) {
      throw new ValidationError(
        "Aggregate ranking positions must be contiguous and start at one.",
      );
    }

    if (
      input.result.selectedSubmissionId &&
      !submissionIds.has(input.result.selectedSubmissionId)
    ) {
      throw new ValidationError(
        "The selected submission does not belong to this campaign.",
      );
    }

    const expectedCommitment = sha256(
      stableStringify({
        providerTaskId: input.providerTaskId,
        chainId: input.chainId,
        transactionHash: input.transactionHash.toLowerCase(),
        receiptHash: input.receiptHash,
        result: input.result,
      }),
    );

    if (expectedCommitment !== input.resultCommitment) {
      throw new ValidationError(
        "The aggregate result commitment does not match the callback payload.",
      );
    }

    const now = new Date();
    await withTransaction(async (transaction) => {
      const completed = await transaction.computationJob.updateMany({
        where: {
          id: job.id,
          status: { in: ["PENDING", "QUEUED", "RUNNING"] },
        },
        data: {
          status: "SUCCEEDED",
          providerTaskId: input.providerTaskId,
          providerDealId: input.providerDealId,
          chainId: input.chainId,
          resultCommitment: input.resultCommitment,
          receiptHash: input.receiptHash,
          completedAt: now,
          startedAt: now,
        },
      });
      if (completed.count !== 1) {
        throw new ConflictError(
          "The computation job was completed by another callback.",
        );
      }
      const evaluatorIds = job.campaign.evaluators.map(
        (evaluator) => evaluator.userId,
      );
      const eligibleSubmissionIds = job.campaign.submissions.map(
        (submission) => submission.id,
      );
      await transaction.evaluation.updateMany({
        where: {
          campaignId: job.campaignId,
          evaluatorId: { in: evaluatorIds },
          submissionId: { in: eligibleSubmissionIds },
          status: "SUBMITTED",
        },
        data: { status: "INCLUDED" },
      });
      if (input.result.selectedSubmissionId) {
        await transaction.submission.update({
          where: { id: input.result.selectedSubmissionId },
          data: { status: "SELECTED" },
        });
      }
      await transaction.evaluationCampaign.update({
        where: { id: job.campaignId },
        data: { status: "COMPLETED" },
      });
      await transaction.decisionResult.upsert({
        where: { campaignId: job.campaignId },
        update: {
          computationJobId: job.id,
          status: "VERIFIED",
          selectedSubmissionId: input.result.selectedSubmissionId,
          decision: input.result.decision,
          overallScore: input.result.overallScore,
          ranking: input.result.ranking,
          summary: input.result.summary,
          consensusSummary: input.result.consensusSummary,
          statistics: input.result.statistics,
          providerTaskId: input.providerTaskId,
          resultCommitment: input.resultCommitment,
          transactionHash: input.transactionHash.toLowerCase(),
          publishedAt: now,
          verifiedAt: now,
        },
        create: {
          campaignId: job.campaignId,
          computationJobId: job.id,
          status: "VERIFIED",
          selectedSubmissionId: input.result.selectedSubmissionId,
          decision: input.result.decision,
          overallScore: input.result.overallScore,
          ranking: input.result.ranking,
          summary: input.result.summary,
          consensusSummary: input.result.consensusSummary,
          statistics: input.result.statistics,
          providerTaskId: input.providerTaskId,
          resultCommitment: input.resultCommitment,
          transactionHash: input.transactionHash.toLowerCase(),
          publishedAt: now,
          verifiedAt: now,
        },
      });
      await transaction.auditLog.createMany({
        data: [
          {
            organizationId: job.campaign.organizationId,
            campaignId: job.campaignId,
            action: "COMPLETE_COMPUTATION",
            entityType: "ComputationJob",
            entityId: job.id,
            metadata: {
              status: "SUCCEEDED",
              providerTaskId: input.providerTaskId,
              resultCommitment: input.resultCommitment,
            },
          },
          {
            organizationId: job.campaign.organizationId,
            campaignId: job.campaignId,
            action: "PUBLISH_RESULT",
            entityType: "DecisionResult",
            entityId: job.campaignId,
            metadata: {
              transactionHash: input.transactionHash.toLowerCase(),
              chainId: input.chainId,
            },
          },
        ],
      });
      await transaction.notification.createMany({
        data: job.campaign.organization.members.map((member) => ({
          userId: member.userId,
          type: "RESULT" as const,
          title: "Verified decision available",
          body: `${job.campaign.title} has a verified confidential result.`,
          data: {
            organizationId: job.campaign.organizationId,
            campaignId: job.campaignId,
            computationJobId: job.id,
          },
        })),
      });
    });

    return NextResponse.json({ received: true, status: "SUCCEEDED" });
  } catch (error) {
    return apiError(error);
  }
}
