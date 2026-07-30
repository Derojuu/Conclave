import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";
import {
  CampaignStatus,
  CriterionType,
  NotificationType,
  OrganizationRole,
  SubmissionLinkType,
  SubmissionStatus,
} from "../lib/generated/prisma/enums";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to seed demo data.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ids = {
  template: "de100000-0000-4000-8000-000000000001",
  criterionMerit: "de110000-0000-4000-8000-000000000001",
  criterionFeasibility: "de110000-0000-4000-8000-000000000002",
  criterionImpact: "de110000-0000-4000-8000-000000000003",
  criterionRisk: "de110000-0000-4000-8000-000000000004",
  campaign: "de300000-0000-4000-8000-000000000001",
  northstar: "de400000-0000-4000-8000-000000000001",
  helix: "de400000-0000-4000-8000-000000000002",
  vector: "de400000-0000-4000-8000-000000000003",
  notification: "de700000-0000-4000-8000-000000000001",
} as const;

function readArgument(name: string) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1]?.trim() : undefined;

  if (!value || value.startsWith("--")) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function main() {
  const ownerEmail = readArgument("--owner-email").toLowerCase();
  const evaluatorEmail = readArgument("--evaluator-email").toLowerCase();
  const organizationSlug = readArgument("--organization-slug").toLowerCase();
  const deadline = new Date("2026-08-31T23:59:59.000Z");

  const summary = await prisma.$transaction(
    async (database) => {
      const [owner, evaluator, organization] = await Promise.all([
        database.user.findUnique({ where: { email: ownerEmail } }),
        database.user.findUnique({ where: { email: evaluatorEmail } }),
        database.organization.findUnique({ where: { slug: organizationSlug } }),
      ]);

      if (!owner) {
        throw new Error(`Owner account ${ownerEmail} has not signed in yet.`);
      }
      if (!evaluator) {
        throw new Error(
          `Evaluator account ${evaluatorEmail} has not signed in yet.`,
        );
      }
      if (!organization) {
        throw new Error(`Organization ${organizationSlug} does not exist.`);
      }
      if (organization.ownerId !== owner.id) {
        throw new Error(
          `${ownerEmail} is not the owner of ${organizationSlug}.`,
        );
      }

      await Promise.all([
        database.organizationMember.upsert({
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
        database.organizationMember.upsert({
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
        database.userSettings.upsert({
          where: { userId: owner.id },
          update: { activeOrganizationId: organization.id },
          create: {
            userId: owner.id,
            activeOrganizationId: organization.id,
          },
        }),
        database.userSettings.upsert({
          where: { userId: evaluator.id },
          update: { activeOrganizationId: organization.id },
          create: {
            userId: evaluator.id,
            activeOrganizationId: organization.id,
          },
        }),
      ]);

      const template = await database.evaluationTemplate.upsert({
        where: { id: ids.template },
        update: {
          organizationId: organization.id,
          title: "Confidential Research Grant Assessment",
          description:
            "A weighted assessment for selecting high-impact research proposals.",
          instructions:
            "Review each proposal independently and score every criterion from 0 to 100.",
          deadline,
          isDefault: true,
        },
        create: {
          id: ids.template,
          organizationId: organization.id,
          title: "Confidential Research Grant Assessment",
          description:
            "A weighted assessment for selecting high-impact research proposals.",
          instructions:
            "Review each proposal independently and score every criterion from 0 to 100.",
          deadline,
          version: 1,
          isDefault: true,
          createdById: owner.id,
        },
      });

      const criteria = [
        {
          id: ids.criterionMerit,
          key: "technical-merit",
          label: "Technical merit",
          description: "Quality, originality, and strength of the methodology.",
          type: CriterionType.NUMERIC,
          weight: 0.35,
          position: 0,
        },
        {
          id: ids.criterionFeasibility,
          key: "feasibility",
          label: "Feasibility",
          description:
            "Ability to deliver within the proposed time and budget.",
          type: CriterionType.NUMERIC,
          weight: 0.25,
          position: 1,
        },
        {
          id: ids.criterionImpact,
          key: "expected-impact",
          label: "Expected impact",
          description: "Potential benefit to research and the wider community.",
          type: CriterionType.NUMERIC,
          weight: 0.25,
          position: 2,
        },
        {
          id: ids.criterionRisk,
          key: "risk-management",
          label: "Risk management",
          description:
            "Awareness of risks and quality of proposed mitigations.",
          type: CriterionType.NUMERIC,
          weight: 0.15,
          position: 3,
        },
      ];

      for (const criterion of criteria) {
        await database.evaluationCriterion.upsert({
          where: { id: criterion.id },
          update: {
            templateId: template.id,
            key: criterion.key,
            label: criterion.label,
            description: criterion.description,
            type: criterion.type,
            weight: criterion.weight,
            minScore: 0,
            maxScore: 100,
            position: criterion.position,
          },
          create: {
            ...criterion,
            templateId: template.id,
            minScore: 0,
            maxScore: 100,
          },
        });
      }

      const campaign = await database.evaluationCampaign.upsert({
        where: { id: ids.campaign },
        update: {
          organizationId: organization.id,
          evaluationTemplateId: template.id,
          title: "Research Grant 2026 — Final Review",
          description:
            "Confidential final-stage assessment of three research proposals.",
          deadline,
        },
        create: {
          id: ids.campaign,
          organizationId: organization.id,
          evaluationTemplateId: template.id,
          title: "Research Grant 2026 — Final Review",
          description:
            "Confidential final-stage assessment of three research proposals.",
          status: CampaignStatus.EVALUATING,
          deadline,
          createdById: owner.id,
        },
      });

      await database.campaignEvaluator.upsert({
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

      const submissionInputs = [
        {
          id: ids.northstar,
          title: "Northstar",
          description:
            "A distributed diagnostics platform for earlier detection of preventable disease.",
          kind: "Health research",
          url: "https://example.com/northstar-proposal",
        },
        {
          id: ids.helix,
          title: "Helix",
          description:
            "A clinical data interoperability study focused on secure cross-institution collaboration.",
          kind: "Clinical systems",
          url: "https://example.com/helix-proposal",
        },
        {
          id: ids.vector,
          title: "Vector",
          description:
            "A public-health forecasting initiative using privacy-preserving regional signals.",
          kind: "Public health",
          url: "https://example.com/vector-proposal",
        },
      ];

      for (const input of submissionInputs) {
        const submission = await database.submission.upsert({
          where: { id: input.id },
          update: {
            campaignId: campaign.id,
            title: input.title,
            description: input.description,
            kind: input.kind,
            status: SubmissionStatus.IN_REVIEW,
            metadata: { demo: true, stage: "final-review" },
          },
          create: {
            id: input.id,
            campaignId: campaign.id,
            title: input.title,
            description: input.description,
            kind: input.kind,
            status: SubmissionStatus.IN_REVIEW,
            metadata: { demo: true, stage: "final-review" },
            ownerId: owner.id,
          },
        });

        await Promise.all([
          database.submissionContributor.upsert({
            where: {
              submissionId_userId: {
                submissionId: submission.id,
                userId: owner.id,
              },
            },
            update: { role: "SUBMITTER", addedById: owner.id },
            create: {
              submissionId: submission.id,
              userId: owner.id,
              role: "SUBMITTER",
              addedById: owner.id,
            },
          }),
          database.submissionLink.upsert({
            where: {
              submissionId_url: {
                submissionId: submission.id,
                url: input.url,
              },
            },
            update: {
              type: SubmissionLinkType.DOCUMENT,
              label: "Proposal brief",
              position: 0,
            },
            create: {
              submissionId: submission.id,
              type: SubmissionLinkType.DOCUMENT,
              label: "Proposal brief",
              url: input.url,
              position: 0,
            },
          }),
        ]);
      }

      await database.notification.upsert({
        where: { id: ids.notification },
        update: {
          userId: evaluator.id,
          type: NotificationType.EVALUATION,
          title: "Research Grant 2026 evaluation assigned",
          body: "Three proposals are ready for your confidential assessment.",
          data: { campaignId: campaign.id, organizationId: organization.id },
          readAt: null,
        },
        create: {
          id: ids.notification,
          userId: evaluator.id,
          type: NotificationType.EVALUATION,
          title: "Research Grant 2026 evaluation assigned",
          body: "Three proposals are ready for your confidential assessment.",
          data: { campaignId: campaign.id, organizationId: organization.id },
        },
      });

      const verifiedCampaign =
        await database.evaluationCampaign.findUniqueOrThrow({
          where: { id: campaign.id },
          select: {
            title: true,
            status: true,
            evaluationTemplate: {
              select: {
                title: true,
                _count: { select: { criteria: true } },
              },
            },
            evaluators: {
              select: { evaluator: { select: { email: true } } },
            },
            _count: {
              select: {
                submissions: true,
                evaluations: true,
              },
            },
            result: { select: { status: true } },
          },
        });
      const memberships = await database.organizationMember.findMany({
        where: {
          organizationId: organization.id,
          userId: { in: [owner.id, evaluator.id] },
        },
        orderBy: { role: "asc" },
        select: { role: true, user: { select: { email: true } } },
      });

      return {
        organization: organization.name,
        owner: owner.email,
        evaluator: evaluator.email,
        memberships,
        template: verifiedCampaign.evaluationTemplate?.title,
        campaign: verifiedCampaign.title,
        campaignStatus: verifiedCampaign.status,
        assignedEvaluators: verifiedCampaign.evaluators.map(
          ({ evaluator: assignedEvaluator }) => assignedEvaluator.email,
        ),
        criteria: verifiedCampaign.evaluationTemplate?._count.criteria ?? 0,
        submissions: verifiedCampaign._count.submissions,
        evaluations: verifiedCampaign._count.evaluations,
        result: verifiedCampaign.result?.status ?? null,
      };
    },
    { maxWait: 20_000, timeout: 60_000 },
  );

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
