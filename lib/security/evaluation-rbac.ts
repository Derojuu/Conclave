import "server-only";

import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError,
} from "@/lib/security/errors";

export async function requireEvaluationAssignment(
  userId: string,
  organizationId: string,
  campaignId: string,
  submissionId: string,
) {
  const assignment = await prisma.campaignEvaluator.findUnique({
    where: {
      campaignId_userId: {
        campaignId,
        userId,
      },
    },
    select: {
      campaign: {
        select: {
          id: true,
          organizationId: true,
          title: true,
          status: true,
          deadline: true,
          evaluationTemplate: {
            select: {
              id: true,
              version: true,
              deadline: true,
            },
          },
        },
      },
    },
  });

  if (
    !assignment ||
    assignment.campaign.organizationId !== organizationId
  ) {
    throw new AuthorizationError(
      "You are not assigned as an evaluator for this campaign.",
    );
  }

  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      campaignId,
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!submission) {
    throw new ResourceNotFoundError("Submission not found.");
  }

  if (!assignment.campaign.evaluationTemplate) {
    throw new ValidationError(
      "This campaign does not have an evaluation template.",
    );
  }

  return {
    campaign: assignment.campaign,
    submission,
    template: assignment.campaign.evaluationTemplate,
  };
}

export async function requireCurrentEvaluationAssignment(
  organizationId: string,
  campaignId: string,
  submissionId: string,
) {
  const user = await requireApiUser();
  const access = await requireEvaluationAssignment(
    user.id,
    organizationId,
    campaignId,
    submissionId,
  );

  return { user, ...access };
}

export function requireEvaluationWindow(input: {
  campaignStatus: string;
  campaignDeadline: Date | null;
  templateDeadline: Date | null;
}) {
  if (input.campaignStatus !== "EVALUATING") {
    throw new ValidationError(
      "Evaluations can only be submitted while the campaign is evaluating.",
    );
  }

  const deadlines = [
    input.campaignDeadline,
    input.templateDeadline,
  ].filter((deadline): deadline is Date => deadline !== null);
  const deadline = deadlines.sort(
    (left, right) => left.getTime() - right.getTime(),
  )[0];

  if (deadline && deadline.getTime() < Date.now()) {
    throw new ValidationError("The evaluation deadline has passed.");
  }
}
