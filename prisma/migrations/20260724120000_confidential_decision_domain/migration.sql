-- Align organization roles with the evaluation domain.
CREATE TYPE "OrganizationRole_new" AS ENUM (
    'OWNER',
    'ADMIN',
    'EVALUATOR',
    'OBSERVER'
);

ALTER TABLE "organization_members"
ALTER COLUMN "role" TYPE "OrganizationRole_new"
USING (
    CASE "role"::text
        WHEN 'JUDGE' THEN 'EVALUATOR'
        ELSE "role"::text
    END
)::"OrganizationRole_new";

ALTER TABLE "invitations"
ALTER COLUMN "role" TYPE "OrganizationRole_new"
USING (
    CASE "role"::text
        WHEN 'JUDGE' THEN 'EVALUATOR'
        ELSE "role"::text
    END
)::"OrganizationRole_new";

DROP TYPE "OrganizationRole";
ALTER TYPE "OrganizationRole_new" RENAME TO "OrganizationRole";

-- Add the confidential-computation lifecycle to campaigns.
ALTER TYPE "CommitteeStatus" ADD VALUE IF NOT EXISTS 'COMPUTING';

-- Replace hackathon-specific submission statuses with generic statuses.
CREATE TYPE "ProjectStatus_new" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'SHORTLISTED',
    'SELECTED',
    'REJECTED',
    'WITHDRAWN',
    'ARCHIVED'
);

ALTER TABLE "projects"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "projects"
ALTER COLUMN "status" TYPE "ProjectStatus_new"
USING (
    CASE "status"::text
        WHEN 'UNDER_REVIEW' THEN 'IN_REVIEW'
        WHEN 'FINALIST' THEN 'SHORTLISTED'
        ELSE "status"::text
    END
)::"ProjectStatus_new";

DROP TYPE "ProjectStatus";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";

ALTER TABLE "projects"
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- Evaluation records contain metadata only; confidential content is sealed.
ALTER TYPE "EvaluationStatus" ADD VALUE IF NOT EXISTS 'SEALED';
ALTER TYPE "EvaluationStatus" ADD VALUE IF NOT EXISTS 'EXCLUDED';

-- Computation orchestration status.
CREATE TYPE "ComputationJobStatus" AS ENUM (
    'PENDING',
    'QUEUED',
    'RUNNING',
    'SUCCEEDED',
    'FAILED',
    'CANCELLED'
);

-- Generic submission resources.
CREATE TYPE "SubmissionLinkType" AS ENUM (
    'WEBSITE',
    'PORTFOLIO',
    'RESUME',
    'GITHUB',
    'DEMO',
    'VIDEO',
    'PITCH_DECK',
    'DOCUMENT',
    'OTHER'
);

ALTER TABLE "projects"
ALTER COLUMN "category" DROP NOT NULL,
ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "project_team_members"
ADD COLUMN "role" VARCHAR(80) NOT NULL DEFAULT 'CONTRIBUTOR';

CREATE TABLE "submission_links" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "type" "SubmissionLinkType" NOT NULL DEFAULT 'OTHER',
    "label" VARCHAR(120) NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "submission_links_pkey" PRIMARY KEY ("id")
);

INSERT INTO "submission_links" (
    "id",
    "submissionId",
    "type",
    "label",
    "url",
    "position",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    "id",
    'GITHUB'::"SubmissionLinkType",
    'GitHub',
    "githubUrl",
    0,
    "createdAt",
    "updatedAt"
FROM "projects"
WHERE "githubUrl" IS NOT NULL AND length(trim("githubUrl")) > 0;

INSERT INTO "submission_links" (
    "id",
    "submissionId",
    "type",
    "label",
    "url",
    "position",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    "id",
    'DEMO'::"SubmissionLinkType",
    'Demo',
    "demoUrl",
    1,
    "createdAt",
    "updatedAt"
FROM "projects"
WHERE "demoUrl" IS NOT NULL AND length(trim("demoUrl")) > 0;

INSERT INTO "submission_links" (
    "id",
    "submissionId",
    "type",
    "label",
    "url",
    "position",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    "id",
    'VIDEO'::"SubmissionLinkType",
    'Video',
    "videoUrl",
    2,
    "createdAt",
    "updatedAt"
FROM "projects"
WHERE "videoUrl" IS NOT NULL AND length(trim("videoUrl")) > 0;

ALTER TABLE "projects"
DROP COLUMN "githubUrl",
DROP COLUMN "demoUrl",
DROP COLUMN "videoUrl";

CREATE TABLE "submission_attachments" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "storageBucket" VARCHAR(120) NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(160) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "submission_links_submissionId_url_key"
ON "submission_links"("submissionId", "url");

CREATE INDEX "submission_links_submissionId_position_idx"
ON "submission_links"("submissionId", "position");

CREATE UNIQUE INDEX "submission_attachments_storagePath_key"
ON "submission_attachments"("storagePath");

CREATE INDEX "submission_attachments_submissionId_createdAt_idx"
ON "submission_attachments"("submissionId", "createdAt");

ALTER TABLE "submission_links"
ADD CONSTRAINT "submission_links_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "submission_attachments"
ADD CONSTRAINT "submission_attachments_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove legacy plaintext evaluator content. It cannot be safely retained
-- because no encryption key or provenance exists for those records.
DROP TABLE "evaluation_comments";
DROP TABLE "evaluation_scores";

CREATE TABLE "encrypted_evaluation_payloads" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "encryptionAlgorithm" VARCHAR(80) NOT NULL,
    "keyReference" VARCHAR(255) NOT NULL,
    "nonce" TEXT NOT NULL,
    "authenticationTag" TEXT,
    "additionalData" TEXT,
    "payloadHash" VARCHAR(128) NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "sealedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "encrypted_evaluation_payloads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "encrypted_evaluation_payloads_evaluationId_key"
ON "encrypted_evaluation_payloads"("evaluationId");

CREATE INDEX "encrypted_evaluation_payloads_payloadHash_idx"
ON "encrypted_evaluation_payloads"("payloadHash");

CREATE INDEX "encrypted_evaluation_payloads_sealedAt_idx"
ON "encrypted_evaluation_payloads"("sealedAt");

ALTER TABLE "encrypted_evaluation_payloads"
ADD CONSTRAINT "encrypted_evaluation_payloads_evaluationId_fkey"
FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- iExec Nox computation jobs store lifecycle and public commitments only.
CREATE TABLE "computation_jobs" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "status" "ComputationJobStatus" NOT NULL DEFAULT 'PENDING',
    "provider" VARCHAR(80) NOT NULL DEFAULT 'IEXEC_NOX',
    "providerTaskId" VARCHAR(160),
    "providerDealId" VARCHAR(160),
    "chainId" INTEGER,
    "appAddress" VARCHAR(42),
    "workerpoolAddress" VARCHAR(42),
    "inputCommitment" VARCHAR(160) NOT NULL,
    "resultCommitment" VARCHAR(160),
    "requestMetadata" JSONB NOT NULL DEFAULT '{}',
    "errorCode" VARCHAR(120),
    "errorMessage" TEXT,
    "queuedAt" TIMESTAMPTZ(6),
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "computation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "computation_jobs_providerTaskId_key"
ON "computation_jobs"("providerTaskId");

CREATE INDEX "computation_jobs_campaignId_createdAt_idx"
ON "computation_jobs"("campaignId", "createdAt");

CREATE INDEX "computation_jobs_campaignId_status_idx"
ON "computation_jobs"("campaignId", "status");

CREATE INDEX "computation_jobs_status_createdAt_idx"
ON "computation_jobs"("status", "createdAt");

CREATE UNIQUE INDEX "computation_jobs_one_active_per_campaign_idx"
ON "computation_jobs"("campaignId")
WHERE "status" IN ('PENDING', 'QUEUED', 'RUNNING');

ALTER TABLE "computation_jobs"
ADD CONSTRAINT "computation_jobs_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "committees"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "computation_jobs"
ADD CONSTRAINT "computation_jobs_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enrich aggregate decision results without introducing evaluator-level data.
ALTER TABLE "decision_results"
ADD COLUMN "computationJobId" UUID,
ADD COLUMN "decision" VARCHAR(255),
ADD COLUMN "summary" TEXT,
ADD COLUMN "consensusSummary" TEXT,
ADD COLUMN "statistics" JSONB,
ADD COLUMN "verifiedAt" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "decision_results_computationJobId_key"
ON "decision_results"("computationJobId");

CREATE INDEX "decision_results_verificationHash_idx"
ON "decision_results"("verificationHash");

ALTER TABLE "decision_results"
ADD CONSTRAINT "decision_results_computationJobId_fkey"
FOREIGN KEY ("computationJobId") REFERENCES "computation_jobs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Audit actions for computation lifecycle.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'START_COMPUTATION';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'COMPLETE_COMPUTATION';
