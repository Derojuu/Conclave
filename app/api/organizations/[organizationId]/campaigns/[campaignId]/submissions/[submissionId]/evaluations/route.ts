import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";
import {
  decodeFunctionData,
  keccak256,
  parseEventLogs,
  toHex,
  type Hex,
} from "viem";

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
import {
  requireCurrentEvaluationAssignment,
  requireEvaluationWindow,
} from "@/lib/security/evaluation-rbac";
import {
  ConflictError,
  ConfigurationError,
  ValidationError,
} from "@/lib/security/errors";
import { noxEvaluationSubmissionSchema } from "@/lib/validation/evaluation";

type EvaluationRouteContext = {
  params: Promise<{
    organizationId: string;
    campaignId: string;
    submissionId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: EvaluationRouteContext,
) {
  try {
    const { organizationId, campaignId, submissionId } = await params;
    const { user } = await requireCurrentEvaluationAssignment(
      organizationId,
      campaignId,
      submissionId,
    );
    const evaluation = await prisma.evaluation.findUnique({
      where: {
        submissionId_evaluatorId: { submissionId, evaluatorId: user.id },
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
        payload: {
          select: { payloadHash: true, keyReference: true, nonce: true },
        },
      },
    });

    return NextResponse.json({
      evaluation,
      noxConfigured: getNoxContractAddress() !== null,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT() {
  return apiError(
    new ValidationError(
      "Nox evaluations are submitted once as final on-chain transactions.",
    ),
  );
}

export async function POST(request: Request, context: EvaluationRouteContext) {
  try {
    const { organizationId, campaignId, submissionId } = await context.params;
    const { user, campaign, template } =
      await requireCurrentEvaluationAssignment(
        organizationId,
        campaignId,
        submissionId,
      );
    requireEvaluationWindow({
      campaignStatus: campaign.status,
      campaignDeadline: campaign.deadline,
      templateDeadline: template.deadline,
    });

    const input = noxEvaluationSubmissionSchema.parse(await request.json());
    const configuredAddress = getNoxContractAddress();
    if (!configuredAddress) {
      throw new ConfigurationError(
        "NEXT_PUBLIC_CONCLAVE_NOX_ADDRESS is required.",
      );
    }
    if (
      input.contractAddress.toLowerCase() !== configuredAddress.toLowerCase()
    ) {
      throw new ValidationError(
        "The evaluation targeted an unexpected contract.",
      );
    }
    if (!user.walletAddress) {
      throw new ValidationError(
        "Link the submitting wallet to your account first.",
      );
    }

    const existing = await prisma.evaluation.findUnique({
      where: {
        submissionId_evaluatorId: { submissionId, evaluatorId: user.id },
      },
      select: { id: true, status: true, payload: { select: { nonce: true } } },
    });
    if (existing?.status === "SUBMITTED") {
      if (
        existing.payload?.nonce.toLowerCase() ===
        input.transactionHash.toLowerCase()
      ) {
        return NextResponse.json({ evaluation: existing, idempotent: true });
      }
      throw new ConflictError(
        "This confidential evaluation has already been submitted.",
      );
    }

    const client = getNoxPublicClient();
    const [receipt, transaction] = await Promise.all([
      client.getTransactionReceipt({ hash: input.transactionHash as Hex }),
      client.getTransaction({ hash: input.transactionHash as Hex }),
    ]);
    if (
      receipt.status !== "success" ||
      transaction.to?.toLowerCase() !== configuredAddress.toLowerCase() ||
      transaction.from.toLowerCase() !== user.walletAddress.toLowerCase()
    ) {
      throw new ValidationError("The Nox score transaction is invalid.");
    }

    const decoded = decodeFunctionData({
      abi: confidentialDecisionEngineAbi,
      data: transaction.input,
    });
    if (decoded.functionName !== "submitScore") {
      throw new ValidationError("Expected a Nox submitScore transaction.");
    }
    const [onchainCampaignId, onchainSubmissionId, handle, proof] =
      decoded.args;
    if (
      onchainCampaignId !== toNoxId(campaignId) ||
      onchainSubmissionId !== toNoxId(submissionId) ||
      handle.toLowerCase() !== input.handle.toLowerCase() ||
      proof.toLowerCase() !== input.handleProof.toLowerCase()
    ) {
      throw new ValidationError(
        "The Nox transaction does not match this assignment.",
      );
    }

    const events = parseEventLogs({
      abi: confidentialDecisionEngineAbi,
      logs: receipt.logs,
      eventName: "ScoreSubmitted",
    });
    if (
      !events.some(
        (event) =>
          event.args.campaignId === toNoxId(campaignId) &&
          event.args.submissionId === toNoxId(submissionId) &&
          event.args.evaluator.toLowerCase() ===
            user.walletAddress?.toLowerCase() &&
          event.args.encryptedScoreHandle.toLowerCase() ===
            input.handle.toLowerCase(),
      )
    ) {
      throw new ValidationError(
        "The confirmed transaction emitted no matching score event.",
      );
    }

    const contextData = Buffer.from(
      JSON.stringify({
        campaignId,
        submissionId,
        templateId: template.id,
        templateVersion: template.version,
      }),
    ).toString("base64");
    const payloadHash = keccak256(
      toHex(
        `${input.handle}:${input.transactionHash}:${campaignId}:${submissionId}`,
      ),
    ).slice(2);
    const requestMetadata = await getRequestMetadata();
    const evaluation = await withTransaction(async (database) => {
      const saved = await database.evaluation.upsert({
        where: {
          submissionId_evaluatorId: { submissionId, evaluatorId: user.id },
        },
        update: { status: "SUBMITTED", submittedAt: new Date() },
        create: {
          campaignId,
          submissionId,
          evaluatorId: user.id,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
      await database.encryptedEvaluationPayload.upsert({
        where: { evaluationId: saved.id },
        update: {
          ciphertext: input.handle,
          encryptedKey: input.handleProof,
          encryptionAlgorithm: "IEXEC_NOX_EUINT256_V1",
          keyReference: configuredAddress,
          nonce: input.transactionHash,
          additionalData: contextData,
          payloadHash,
          schemaVersion: 2,
          sealedAt: new Date(),
        },
        create: {
          evaluationId: saved.id,
          ciphertext: input.handle,
          encryptedKey: input.handleProof,
          encryptionAlgorithm: "IEXEC_NOX_EUINT256_V1",
          keyReference: configuredAddress,
          nonce: input.transactionHash,
          additionalData: contextData,
          payloadHash,
          schemaVersion: 2,
        },
      });
      await database.auditLog.create({
        data: {
          organizationId,
          campaignId,
          actorId: user.id,
          action: "SUBMIT_EVALUATION",
          entityType: "Evaluation",
          entityId: saved.id,
          metadata: {
            chainId: NOX_CHAIN_ID,
            contractAddress: configuredAddress,
            transactionHash: input.transactionHash,
            handle: input.handle,
            scoreScale: NOX_SCORE_SCALE,
          },
          ...requestMetadata,
        },
      });
      return saved;
    });

    return NextResponse.json(
      {
        evaluation: {
          ...evaluation,
          payloadHash,
          transactionHash: input.transactionHash,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
