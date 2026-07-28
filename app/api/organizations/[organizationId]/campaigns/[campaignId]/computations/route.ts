import { NextResponse } from "next/server";
import { keccak256, parseEventLogs, toHex, type Hex } from "viem";
import { z } from "zod";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { withTransaction } from "@/lib/database";
import {
  confidentialDecisionEngineAbi,
  getNoxContractAddress,
  NOX_CHAIN_ID,
  NOX_SCORE_SCALE,
  toNoxId,
} from "@/lib/nox/contract";
import { getNoxPublicClient } from "@/lib/nox/server";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { requireCurrentCampaignPermission } from "@/lib/security/campaign-rbac";
import { ConfigurationError, ValidationError } from "@/lib/security/errors";

type Context = {
  params: Promise<{ organizationId: string; campaignId: string }>;
};
const requestSchema = z
  .object({ transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/) })
  .strict();

export async function GET(_request: Request, { params }: Context) {
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
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { organizationId, campaignId } = await params;
    const { user, campaign: accessCampaign } =
      await requireCurrentCampaignPermission(
        organizationId,
        campaignId,
        ORGANIZATION_PERMISSIONS.resultsPublish,
      );
    if (
      accessCampaign.status !== "EVALUATING" &&
      accessCampaign.status !== "COMPUTING"
    ) {
      throw new ValidationError(
        "The campaign is not ready to publish a decision.",
      );
    }
    const input = requestSchema.parse(await request.json());
    const contractAddress = getNoxContractAddress();
    if (!contractAddress)
      throw new ConfigurationError(
        "NEXT_PUBLIC_CONCLAVE_NOX_ADDRESS is required.",
      );
    const client = getNoxPublicClient();
    const receipt = await client.getTransactionReceipt({
      hash: input.transactionHash as Hex,
    });
    if (
      receipt.status !== "success" ||
      receipt.to?.toLowerCase() !== contractAddress.toLowerCase()
    ) {
      throw new ValidationError("The Nox result transaction is invalid.");
    }
    const events = parseEventLogs({
      abi: confidentialDecisionEngineAbi,
      logs: receipt.logs,
      eventName: "ResultPublished",
    });
    const event = events.find(
      (candidate) => candidate.args.campaignId === toNoxId(campaignId),
    );
    if (!event)
      throw new ValidationError("No matching Nox result event was emitted.");

    const campaign = await prisma.evaluationCampaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: {
        title: true,
        submissions: {
          orderBy: { id: "asc" },
          select: { id: true, title: true },
        },
      },
    });
    const evaluatorCount = Number(event.args.evaluatorCount);
    const totals = await Promise.all(
      campaign.submissions.map(async (submission) => ({
        submission,
        total: await client.readContract({
          address: contractAddress,
          abi: confidentialDecisionEngineAbi,
          functionName: "getPublishedTotal",
          args: [toNoxId(campaignId), toNoxId(submission.id)],
        }),
      })),
    );
    const ranking = totals
      .map(({ submission, total }) => ({
        submissionId: submission.id,
        score: Number(total) / evaluatorCount / (NOX_SCORE_SCALE / 100),
      }))
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
    const winner = ranking[0];
    if (!winner)
      throw new ValidationError("The Nox result contains no submissions.");
    const winnerSubmission = campaign.submissions.find(
      (submission) => submission.id === winner.submissionId,
    )!;
    if (toNoxId(winner.submissionId) !== event.args.winnerSubmissionId) {
      throw new ValidationError(
        "The published winner does not match the Nox aggregate totals.",
      );
    }
    const resultCommitment = keccak256(toHex(JSON.stringify(ranking))).slice(2);
    const requestMetadata = await getRequestMetadata();
    const job = await withTransaction(async (database) => {
      const created = await database.computationJob.create({
        data: {
          campaignId,
          createdById: user.id,
          status: "SUCCEEDED",
          provider: "IEXEC_NOX",
          providerTaskId: input.transactionHash,
          chainId: NOX_CHAIN_ID,
          appAddress: contractAddress,
          inputCommitment: resultCommitment,
          resultCommitment,
          receiptHash: receipt.blockHash.slice(2),
          queuedAt: new Date(),
          startedAt: new Date(),
          completedAt: new Date(),
          requestMetadata: { evaluatorCount, submissionCount: ranking.length },
        },
      });
      await database.decisionResult.upsert({
        where: { campaignId },
        update: {
          computationJobId: created.id,
          selectedSubmissionId: winner.submissionId,
          status: "VERIFIED",
          decision: `Selected ${winnerSubmission.title}`,
          ranking,
          overallScore: winner.score,
          summary: `${winnerSubmission.title} received the highest aggregate score from Nox-confidential evaluations.`,
          consensusSummary: `${evaluatorCount} authorized evaluators contributed encrypted weighted scores. Only per-submission aggregates were decrypted after every evaluation was submitted.`,
          statistics: {
            evaluator_count: evaluatorCount,
            submission_count: ranking.length,
          },
          providerTaskId: input.transactionHash,
          resultCommitment,
          transactionHash: input.transactionHash,
          publishedAt: new Date(),
          verifiedAt: new Date(),
        },
        create: {
          campaignId,
          computationJobId: created.id,
          selectedSubmissionId: winner.submissionId,
          status: "VERIFIED",
          decision: `Selected ${winnerSubmission.title}`,
          ranking,
          overallScore: winner.score,
          summary: `${winnerSubmission.title} received the highest aggregate score from Nox-confidential evaluations.`,
          consensusSummary: `${evaluatorCount} authorized evaluators contributed encrypted weighted scores. Only per-submission aggregates were decrypted after every evaluation was submitted.`,
          statistics: {
            evaluator_count: evaluatorCount,
            submission_count: ranking.length,
          },
          providerTaskId: input.transactionHash,
          resultCommitment,
          transactionHash: input.transactionHash,
          publishedAt: new Date(),
          verifiedAt: new Date(),
        },
      });
      await database.evaluationCampaign.update({
        where: { id: campaignId },
        data: { status: "COMPLETED" },
      });
      await database.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "PUBLISH_RESULT",
          entityType: "ComputationJob",
          entityId: created.id,
          metadata: {
            transactionHash: input.transactionHash,
            contractAddress,
            resultCommitment,
          },
          ...requestMetadata,
        },
      });
      return created;
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
