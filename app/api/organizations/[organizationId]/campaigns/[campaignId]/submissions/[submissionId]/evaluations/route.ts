import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import {
  getEvaluationEncryptionConfig,
  requireEvaluationEncryptionConfig,
} from "@/lib/confidential/encryption-config";
import { getEvaluatorReference } from "@/lib/confidential/evaluator-reference";
import {
  computeEnvelopeHash,
  envelopeHashMatches,
} from "@/lib/confidential/evaluation-envelope";
import { withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import {
  requireCurrentEvaluationAssignment,
  requireEvaluationWindow,
} from "@/lib/security/evaluation-rbac";
import {
  ConflictError,
  ValidationError,
} from "@/lib/security/errors";
import {
  encryptedEvaluationEnvelopeSchema,
  evaluationAdditionalDataSchema,
} from "@/lib/validation/evaluation";
import { apiError } from "@/lib/api-response";

type EvaluationRouteContext = {
  params: Promise<{
    organizationId: string;
    campaignId: string;
    submissionId: string;
  }>;
};

function parseAdditionalData(value: string) {
  try {
    return evaluationAdditionalDataSchema.parse(
      JSON.parse(Buffer.from(value, "base64").toString("utf8")),
    );
  } catch {
    throw new ValidationError("Encrypted evaluation context is invalid.");
  }
}

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
        submissionId_evaluatorId: {
          submissionId,
          evaluatorId: user.id,
        },
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
        payload: {
          select: {
            payloadHash: true,
            sealedAt: true,
            schemaVersion: true,
            encryptionAlgorithm: true,
            keyReference: true,
          },
        },
      },
    });

    return NextResponse.json({
      evaluation,
      encryptionConfigured: getEvaluationEncryptionConfig() !== null,
    });
  } catch (error) {
    return apiError(error);
  }
}

async function persistEncryptedEvaluation(
  request: Request,
  context: EvaluationRouteContext,
  finalSubmission: boolean,
) {
  try {
    const { organizationId, campaignId, submissionId } =
      await context.params;
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

    const encryptionConfig = requireEvaluationEncryptionConfig();
    const envelope = encryptedEvaluationEnvelopeSchema.parse(
      await request.json(),
    );

    if (
      envelope.encryptionAlgorithm !==
        encryptionConfig.encryptionAlgorithm ||
      envelope.keyReference !== encryptionConfig.keyReference
    ) {
      throw new ValidationError(
        "The evaluation was encrypted for an unexpected Nox key.",
      );
    }

    if (!envelopeHashMatches(envelope)) {
      throw new ValidationError(
        "Encrypted evaluation integrity verification failed.",
      );
    }

    const additionalData = parseAdditionalData(envelope.additionalData);
    const evaluatorRef = getEvaluatorReference(campaignId, user.id);
    if (
      additionalData.campaignId !== campaignId ||
      additionalData.submissionId !== submissionId ||
      additionalData.evaluatorRef !== evaluatorRef ||
      additionalData.templateId !== template.id ||
      additionalData.templateVersion !== template.version
    ) {
      throw new ValidationError(
        "Encrypted evaluation context does not match this assignment.",
      );
    }

    const existing = await prisma.evaluation.findUnique({
      where: {
        submissionId_evaluatorId: {
          submissionId,
          evaluatorId: user.id,
        },
      },
      select: {
        id: true,
        status: true,
        payload: {
          select: { payloadHash: true },
        },
      },
    });

    if (existing?.status === "SUBMITTED") {
      if (
        finalSubmission &&
        existing.payload?.payloadHash === envelope.payloadHash
      ) {
        return NextResponse.json({
          evaluation: {
            id: existing.id,
            status: existing.status,
            payloadHash: existing.payload.payloadHash,
          },
          idempotent: true,
        });
      }

      throw new ConflictError(
        "This confidential evaluation has already been submitted.",
      );
    }

    const requestMetadata = await getRequestMetadata();
    const evaluation = await withTransaction(async (transaction) => {
      const saved = await transaction.evaluation.upsert({
        where: {
          submissionId_evaluatorId: {
            submissionId,
            evaluatorId: user.id,
          },
        },
        update: {
          status: finalSubmission ? "SUBMITTED" : "SEALED",
          submittedAt: finalSubmission ? new Date() : null,
        },
        create: {
          campaignId,
          submissionId,
          evaluatorId: user.id,
          status: finalSubmission ? "SUBMITTED" : "SEALED",
          submittedAt: finalSubmission ? new Date() : null,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
        },
      });

      await transaction.encryptedEvaluationPayload.upsert({
        where: { evaluationId: saved.id },
        update: {
          ciphertext: envelope.ciphertext,
          encryptedKey: envelope.encryptedKey,
          encryptionAlgorithm: envelope.encryptionAlgorithm,
          keyReference: envelope.keyReference,
          nonce: envelope.nonce,
          authenticationTag: null,
          additionalData: envelope.additionalData,
          payloadHash: envelope.payloadHash,
          schemaVersion: envelope.schemaVersion,
          sealedAt: new Date(),
        },
        create: {
          evaluationId: saved.id,
          ciphertext: envelope.ciphertext,
          encryptedKey: envelope.encryptedKey,
          encryptionAlgorithm: envelope.encryptionAlgorithm,
          keyReference: envelope.keyReference,
          nonce: envelope.nonce,
          additionalData: envelope.additionalData,
          payloadHash: envelope.payloadHash,
          schemaVersion: envelope.schemaVersion,
        },
      });

      if (finalSubmission) {
        await transaction.auditLog.create({
          data: {
            organizationId,
            campaignId,
            actorId: user.id,
            action: "SUBMIT_EVALUATION",
            entityType: "Evaluation",
            entityId: saved.id,
            metadata: {
              payloadHash: envelope.payloadHash,
              schemaVersion: envelope.schemaVersion,
              encryptionAlgorithm: envelope.encryptionAlgorithm,
            },
            ...requestMetadata,
          },
        });
        await transaction.notification.create({
          data: {
            userId: user.id,
            type: "EVALUATION",
            title: "Evaluation submitted",
            body: "Your confidential evaluation was sealed successfully.",
            data: {
              organizationId,
              campaignId,
              submissionId,
              evaluationId: saved.id,
            },
          },
        });
      }

      return saved;
    });

    return NextResponse.json(
      {
        evaluation: {
          ...evaluation,
          payloadHash: computeEnvelopeHash({
            schemaVersion: envelope.schemaVersion,
            encryptionAlgorithm: envelope.encryptionAlgorithm,
            keyReference: envelope.keyReference,
            encryptedKey: envelope.encryptedKey,
            nonce: envelope.nonce,
            ciphertext: envelope.ciphertext,
            additionalData: envelope.additionalData,
          }),
        },
      },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: Request,
  context: EvaluationRouteContext,
) {
  return persistEncryptedEvaluation(request, context, false);
}

export async function POST(
  request: Request,
  context: EvaluationRouteContext,
) {
  return persistEncryptedEvaluation(request, context, true);
}
