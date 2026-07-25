import "dotenv/config";

import { createHash } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import {
  AuditAction,
  CampaignStatus,
  ComputationJobStatus,
  CriterionType,
  DecisionResultStatus,
  EvaluationStatus,
  InvitationStatus,
  NotificationType,
  OrganizationRole,
  PlatformRole,
  SubmissionLinkType,
  SubmissionStatus,
} from "../lib/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ids = {
  owner: "00000000-0000-4000-8000-000000000001",
  evaluator: "00000000-0000-4000-8000-000000000002",
  observer: "00000000-0000-4000-8000-000000000003",
  organization: "10000000-0000-4000-8000-000000000001",
  template: "20000000-0000-4000-8000-000000000001",
  criterionTechnical: "21000000-0000-4000-8000-000000000001",
  criterionLeadership: "21000000-0000-4000-8000-000000000002",
  campaign: "30000000-0000-4000-8000-000000000001",
  submissionA: "40000000-0000-4000-8000-000000000001",
  submissionB: "40000000-0000-4000-8000-000000000002",
  evaluationA: "50000000-0000-4000-8000-000000000001",
  evaluationB: "50000000-0000-4000-8000-000000000002",
  encryptedPayloadA: "51000000-0000-4000-8000-000000000001",
  encryptedPayloadB: "51000000-0000-4000-8000-000000000002",
  computationJob: "60000000-0000-4000-8000-000000000001",
  result: "61000000-0000-4000-8000-000000000001",
  notification: "70000000-0000-4000-8000-000000000001",
  audit: "80000000-0000-4000-8000-000000000001",
  invitation: "90000000-0000-4000-8000-000000000001",
} as const;

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

function createSeedEnvelope(input: {
  campaignId: string;
  submissionId: string;
  evaluatorId: string;
  templateId: string;
  templateVersion: number;
  label: string;
}) {
  const evaluatorRef = hash(
    `${input.campaignId}:${input.evaluatorId}:conclave-evaluator`,
  );
  const additionalData = Buffer.from(
    JSON.stringify({
      schemaVersion: 1,
      campaignId: input.campaignId,
      submissionId: input.submissionId,
      evaluatorRef,
      templateId: input.templateId,
      templateVersion: input.templateVersion,
    }),
  ).toString("base64");
  const envelope = {
    schemaVersion: 1,
    encryptionAlgorithm: "RSA-OAEP-256+A256GCM",
    keyReference: "iexec-nox://seed/evaluation-key-v1",
    encryptedKey: Buffer.from(
      `seed-wrapped-content-key-${input.label}`,
    ).toString("base64"),
    nonce: Buffer.from(`seed-nonce-${input.label}`).toString("base64"),
    ciphertext: Buffer.from(
      `sealed-evaluation-payload-${input.label}`,
    ).toString("base64"),
    additionalData,
  };

  return {
    ...envelope,
    authenticationTag: null,
    payloadHash: hash(
      [
        envelope.schemaVersion,
        envelope.encryptionAlgorithm,
        envelope.keyReference,
        envelope.encryptedKey,
        envelope.nonce,
        envelope.ciphertext,
        envelope.additionalData,
      ].join("."),
    ),
  };
}

async function main() {
  const owner = await prisma.user.upsert({
    where: { id: ids.owner },
    update: {
      fullName: "Conclave Administrator",
      email: "admin@conclave.local",
      platformRole: PlatformRole.SUPER_ADMIN,
    },
    create: {
      id: ids.owner,
      fullName: "Conclave Administrator",
      email: "admin@conclave.local",
      platformRole: PlatformRole.SUPER_ADMIN,
    },
  });

  const evaluator = await prisma.user.upsert({
    where: { id: ids.evaluator },
    update: {
      fullName: "Evaluation Member",
      email: "evaluator@conclave.local",
    },
    create: {
      id: ids.evaluator,
      fullName: "Evaluation Member",
      email: "evaluator@conclave.local",
    },
  });

  const observer = await prisma.user.upsert({
    where: { id: ids.observer },
    update: {
      fullName: "Decision Observer",
      email: "observer@conclave.local",
    },
    create: {
      id: ids.observer,
      fullName: "Decision Observer",
      email: "observer@conclave.local",
    },
  });

  await Promise.all(
    [owner, evaluator, observer].map((user) =>
      prisma.userSettings.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      }),
    ),
  );

  const organization = await prisma.organization.upsert({
    where: { slug: "northstar-research" },
    update: {
      name: "Northstar Research",
      ownerId: owner.id,
      description:
        "Research organization using confidential evaluation for high-stakes decisions.",
    },
    create: {
      id: ids.organization,
      name: "Northstar Research",
      slug: "northstar-research",
      ownerId: owner.id,
      description:
        "Research organization using confidential evaluation for high-stakes decisions.",
    },
  });

  await Promise.all(
    [owner, evaluator, observer].map((user) =>
      prisma.userSettings.update({
        where: { userId: user.id },
        data: { activeOrganizationId: organization.id },
      }),
    ),
  );

  await Promise.all([
    prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: owner.id,
        },
      },
      update: { role: OrganizationRole.OWNER },
      create: {
        organizationId: organization.id,
        userId: owner.id,
        role: OrganizationRole.OWNER,
      },
    }),
    prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: evaluator.id,
        },
      },
      update: { role: OrganizationRole.EVALUATOR },
      create: {
        organizationId: organization.id,
        userId: evaluator.id,
        role: OrganizationRole.EVALUATOR,
      },
    }),
    prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: observer.id,
        },
      },
      update: { role: OrganizationRole.OBSERVER },
      create: {
        organizationId: organization.id,
        userId: observer.id,
        role: OrganizationRole.OBSERVER,
      },
    }),
  ]);

  const template = await prisma.evaluationTemplate.upsert({
    where: {
      organizationId_title_version: {
        organizationId: organization.id,
        title: "Technical Leadership Assessment",
        version: 1,
      },
    },
    update: {
      description:
        "Reusable assessment for senior technical leadership candidates.",
      instructions:
        "Evaluate independently. Individual scores, recommendations, and comments remain confidential.",
      deadline: new Date("2026-08-31T23:59:59.000Z"),
      isDefault: true,
    },
    create: {
      id: ids.template,
      organizationId: organization.id,
      title: "Technical Leadership Assessment",
      description:
        "Reusable assessment for senior technical leadership candidates.",
      instructions:
        "Evaluate independently. Individual scores, recommendations, and comments remain confidential.",
      deadline: new Date("2026-08-31T23:59:59.000Z"),
      isDefault: true,
      createdById: owner.id,
    },
  });

  await Promise.all([
    prisma.evaluationCriterion.upsert({
      where: {
        templateId_key: {
          templateId: template.id,
          key: "technical-ability",
        },
      },
      update: {
        label: "Technical ability",
        description: "Architecture, engineering judgment, and execution.",
        type: CriterionType.NUMERIC,
        weight: 0.6,
        minScore: 0,
        maxScore: 100,
        position: 0,
      },
      create: {
        id: ids.criterionTechnical,
        templateId: template.id,
        key: "technical-ability",
        label: "Technical ability",
        description: "Architecture, engineering judgment, and execution.",
        type: CriterionType.NUMERIC,
        weight: 0.6,
        minScore: 0,
        maxScore: 100,
        position: 0,
      },
    }),
    prisma.evaluationCriterion.upsert({
      where: {
        templateId_key: {
          templateId: template.id,
          key: "leadership",
        },
      },
      update: {
        label: "Leadership",
        description: "Communication, influence, and decision quality.",
        type: CriterionType.NUMERIC,
        weight: 0.4,
        minScore: 0,
        maxScore: 100,
        position: 1,
      },
      create: {
        id: ids.criterionLeadership,
        templateId: template.id,
        key: "leadership",
        label: "Leadership",
        description: "Communication, influence, and decision quality.",
        type: CriterionType.NUMERIC,
        weight: 0.4,
        minScore: 0,
        maxScore: 100,
        position: 1,
      },
    }),
  ]);

  const campaign = await prisma.evaluationCampaign.upsert({
    where: { id: ids.campaign },
    update: {
      evaluationTemplateId: template.id,
      status: CampaignStatus.COMPLETED,
    },
    create: {
      id: ids.campaign,
      organizationId: organization.id,
      evaluationTemplateId: template.id,
      title: "Senior Backend Engineer Hiring",
      description:
        "Confidential committee assessment for a senior engineering appointment.",
      status: CampaignStatus.COMPLETED,
      deadline: new Date("2026-08-31T23:59:59.000Z"),
      createdById: owner.id,
    },
  });

  await prisma.campaignEvaluator.upsert({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: evaluator.id,
      },
    },
    update: { assignedById: owner.id },
    create: {
      campaignId: campaign.id,
      userId: evaluator.id,
      assignedById: owner.id,
    },
  });

  const submissionA = await prisma.submission.upsert({
    where: { id: ids.submissionA },
    update: {
      kind: "Candidate",
      status: SubmissionStatus.SELECTED,
      metadata: { department: "Engineering", location: "Remote" },
    },
    create: {
      id: ids.submissionA,
      campaignId: campaign.id,
      title: "Candidate A",
      description:
        "Senior backend engineering candidate with distributed systems experience.",
      kind: "Candidate",
      status: SubmissionStatus.SELECTED,
      metadata: { department: "Engineering", location: "Remote" },
      ownerId: owner.id,
    },
  });

  const submissionB = await prisma.submission.upsert({
    where: { id: ids.submissionB },
    update: {
      kind: "Candidate",
      status: SubmissionStatus.REJECTED,
      metadata: { department: "Engineering", location: "Hybrid" },
    },
    create: {
      id: ids.submissionB,
      campaignId: campaign.id,
      title: "Candidate B",
      description:
        "Senior backend engineering candidate with platform leadership experience.",
      kind: "Candidate",
      status: SubmissionStatus.REJECTED,
      metadata: { department: "Engineering", location: "Hybrid" },
      ownerId: owner.id,
    },
  });

  await Promise.all([
    prisma.submissionContributor.upsert({
      where: {
        submissionId_userId: {
          submissionId: submissionA.id,
          userId: owner.id,
        },
      },
      update: { role: "OWNER", addedById: owner.id },
      create: {
        submissionId: submissionA.id,
        userId: owner.id,
        role: "OWNER",
        addedById: owner.id,
      },
    }),
    prisma.submissionContributor.upsert({
      where: {
        submissionId_userId: {
          submissionId: submissionB.id,
          userId: owner.id,
        },
      },
      update: { role: "OWNER", addedById: owner.id },
      create: {
        submissionId: submissionB.id,
        userId: owner.id,
        role: "OWNER",
        addedById: owner.id,
      },
    }),
    prisma.submissionLink.upsert({
      where: {
        submissionId_url: {
          submissionId: submissionA.id,
          url: "https://example.com/candidate-a/portfolio",
        },
      },
      update: {
        type: SubmissionLinkType.PORTFOLIO,
        label: "Portfolio",
        position: 0,
      },
      create: {
        submissionId: submissionA.id,
        type: SubmissionLinkType.PORTFOLIO,
        label: "Portfolio",
        url: "https://example.com/candidate-a/portfolio",
        position: 0,
      },
    }),
  ]);

  const [evaluationA, evaluationB] = await Promise.all([
    prisma.evaluation.upsert({
      where: {
        submissionId_evaluatorId: {
          submissionId: submissionA.id,
          evaluatorId: evaluator.id,
        },
      },
      update: {
        status: EvaluationStatus.INCLUDED,
        submittedAt: new Date("2026-07-24T08:00:00.000Z"),
      },
      create: {
        id: ids.evaluationA,
        campaignId: campaign.id,
        submissionId: submissionA.id,
        evaluatorId: evaluator.id,
        status: EvaluationStatus.INCLUDED,
        submittedAt: new Date("2026-07-24T08:00:00.000Z"),
      },
    }),
    prisma.evaluation.upsert({
      where: {
        submissionId_evaluatorId: {
          submissionId: submissionB.id,
          evaluatorId: evaluator.id,
        },
      },
      update: {
        status: EvaluationStatus.INCLUDED,
        submittedAt: new Date("2026-07-24T08:02:00.000Z"),
      },
      create: {
        id: ids.evaluationB,
        campaignId: campaign.id,
        submissionId: submissionB.id,
        evaluatorId: evaluator.id,
        status: EvaluationStatus.INCLUDED,
        submittedAt: new Date("2026-07-24T08:02:00.000Z"),
      },
    }),
  ]);

  const envelopeA = createSeedEnvelope({
    campaignId: campaign.id,
    submissionId: submissionA.id,
    evaluatorId: evaluator.id,
    templateId: template.id,
    templateVersion: template.version,
    label: "a",
  });
  const envelopeB = createSeedEnvelope({
    campaignId: campaign.id,
    submissionId: submissionB.id,
    evaluatorId: evaluator.id,
    templateId: template.id,
    templateVersion: template.version,
    label: "b",
  });
  await Promise.all([
    prisma.encryptedEvaluationPayload.upsert({
      where: { evaluationId: evaluationA.id },
      update: envelopeA,
      create: {
        id: ids.encryptedPayloadA,
        evaluationId: evaluationA.id,
        ...envelopeA,
      },
    }),
    prisma.encryptedEvaluationPayload.upsert({
      where: { evaluationId: evaluationB.id },
      update: envelopeB,
      create: {
        id: ids.encryptedPayloadB,
        evaluationId: evaluationB.id,
        ...envelopeB,
      },
    }),
  ]);

  const inputCommitment = hash(
    `${campaign.id}:${[
      envelopeA.payloadHash,
      envelopeB.payloadHash,
    ]
      .sort()
      .join(":")}`,
  );
  const resultCommitment = hash(
    `${campaign.id}:aggregate-result:version-1`,
  );
  const receiptHash = hash(`${campaign.id}:nox-receipt:version-1`);
  const transactionHash = `0x${hash(
    `${campaign.id}:verified-result-transaction`,
  )}`;
  const computationJob = await prisma.computationJob.upsert({
    where: { id: ids.computationJob },
    update: {
      status: ComputationJobStatus.SUCCEEDED,
      inputCommitment,
      resultCommitment,
      receiptHash,
      chainId: 134,
      completedAt: new Date("2026-07-24T08:15:00.000Z"),
    },
    create: {
      id: ids.computationJob,
      campaignId: campaign.id,
      createdById: owner.id,
      status: ComputationJobStatus.SUCCEEDED,
      providerTaskId: "seed-iexec-nox-task-1",
      providerDealId: "seed-iexec-deal-1",
      chainId: 134,
      inputCommitment,
      resultCommitment,
      receiptHash,
      requestMetadata: {
        schemaVersion: 1,
        evaluatorCount: 1,
        submissionCount: 2,
        evaluationCount: 2,
      },
      queuedAt: new Date("2026-07-24T08:10:00.000Z"),
      startedAt: new Date("2026-07-24T08:11:00.000Z"),
      completedAt: new Date("2026-07-24T08:15:00.000Z"),
    },
  });

  await prisma.decisionResult.upsert({
    where: { campaignId: campaign.id },
    update: {
      computationJobId: computationJob.id,
      status: DecisionResultStatus.VERIFIED,
      selectedSubmissionId: submissionA.id,
      decision: "Recommend proceeding",
      overallScore: 91.4,
      ranking: [
        { submissionId: submissionA.id, rank: 1, score: 91.4 },
        { submissionId: submissionB.id, rank: 2, score: 86.2 },
      ],
      summary:
        "Candidate A received the strongest aggregate assessment across the configured criteria.",
      consensusSummary:
        "The committee consistently recognized strong technical execution and clear leadership communication.",
      statistics: {
        evaluatedSubmissions: 2,
        includedEvaluations: 1,
        criteriaCount: 2,
      },
      providerTaskId: computationJob.providerTaskId,
      resultCommitment,
      transactionHash,
      verifiedAt: new Date("2026-07-24T08:16:00.000Z"),
      publishedAt: new Date("2026-07-24T08:16:00.000Z"),
    },
    create: {
      id: ids.result,
      campaignId: campaign.id,
      computationJobId: computationJob.id,
      status: DecisionResultStatus.VERIFIED,
      selectedSubmissionId: submissionA.id,
      decision: "Recommend proceeding",
      overallScore: 91.4,
      ranking: [
        { submissionId: submissionA.id, rank: 1, score: 91.4 },
        { submissionId: submissionB.id, rank: 2, score: 86.2 },
      ],
      summary:
        "Candidate A received the strongest aggregate assessment across the configured criteria.",
      consensusSummary:
        "The committee consistently recognized strong technical execution and clear leadership communication.",
      statistics: {
        evaluatedSubmissions: 2,
        includedEvaluations: 1,
        criteriaCount: 2,
      },
      providerTaskId: computationJob.providerTaskId,
      resultCommitment,
      transactionHash,
      verifiedAt: new Date("2026-07-24T08:16:00.000Z"),
      publishedAt: new Date("2026-07-24T08:16:00.000Z"),
    },
  });

  await prisma.notification.upsert({
    where: { id: ids.notification },
    update: {},
    create: {
      id: ids.notification,
      userId: evaluator.id,
      type: NotificationType.EVALUATION,
      title: "Evaluation sealed",
      body: "Your confidential evaluation was encrypted and submitted.",
      data: { campaignId: campaign.id, submissionId: submissionA.id },
    },
  });

  await prisma.auditLog.upsert({
    where: { id: ids.audit },
    update: {},
    create: {
      id: ids.audit,
      organizationId: organization.id,
      campaignId: campaign.id,
      actorId: evaluator.id,
      action: AuditAction.SUBMIT_EVALUATION,
      entityType: "Evaluation",
      entityId: evaluationA.id,
      metadata: {
        status: EvaluationStatus.INCLUDED,
        payloadHash: envelopeA.payloadHash,
        schemaVersion: 1,
      },
    },
  });

  const tokenHash = hash("conclave-seed-invitation");
  await prisma.invitation.upsert({
    where: { tokenHash },
    update: {},
    create: {
      id: ids.invitation,
      organizationId: organization.id,
      email: "reviewer@conclave.local",
      role: OrganizationRole.EVALUATOR,
      tokenHash,
      status: InvitationStatus.PENDING,
      invitedById: owner.id,
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
