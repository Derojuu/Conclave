-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'JUDGE');

-- CreateEnum
CREATE TYPE "CommitteeStatus" AS ENUM ('DRAFT', 'OPEN', 'COLLECTING', 'COMPUTING', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CriterionType" AS ENUM ('SCALE', 'NUMERIC', 'BOOLEAN', 'RUBRIC');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'INCLUDED');

-- CreateEnum
CREATE TYPE "DecisionResultStatus" AS ENUM ('PENDING', 'COMPUTING', 'PUBLISHED', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVITATION', 'COMMITTEE', 'EVALUATION', 'RESULT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'INVITE', 'ACCEPT_INVITATION', 'REVOKE_INVITATION', 'SUBMIT_EVALUATION', 'PUBLISH_RESULT', 'CONNECT_WALLET', 'SIGN_IN', 'SIGN_OUT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "avatar" TEXT,
    "walletAddress" VARCHAR(42),
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_challenges" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "nonceHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "logo" TEXT,
    "ownerId" UUID NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("organizationId","userId")
);

-- CreateTable
CREATE TABLE "committees" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "evaluationTemplateId" UUID,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CommitteeStatus" NOT NULL DEFAULT 'DRAFT',
    "deadline" TIMESTAMPTZ(6),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "committeeId" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "submittedById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_templates" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_criteria" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "type" "CriterionType" NOT NULL DEFAULT 'SCALE',
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "minScore" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "maxScore" DECIMAL(10,4) NOT NULL DEFAULT 10,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" UUID NOT NULL,
    "committeeId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "judgeId" UUID NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_scores" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "criterionId" UUID NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_comments" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "criterionId" UUID,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_results" (
    "id" UUID NOT NULL,
    "committeeId" UUID NOT NULL,
    "winnerProjectId" UUID,
    "status" "DecisionResultStatus" NOT NULL DEFAULT 'PENDING',
    "ranking" JSONB,
    "finalScore" DECIMAL(12,4),
    "computationId" VARCHAR(160),
    "verificationHash" VARCHAR(160),
    "transactionHash" VARCHAR(80),
    "publishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "decision_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "committeeId" UUID,
    "actorId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(160),
    "metadata" JSONB,
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" UUID NOT NULL,
    "acceptedById" UUID,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "acceptedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "users_platformRole_idx" ON "users"("platformRole");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_challenges_nonceHash_key" ON "wallet_challenges"("nonceHash");

-- CreateIndex
CREATE INDEX "wallet_challenges_userId_expiresAt_idx" ON "wallet_challenges"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "wallet_challenges_expiresAt_idx" ON "wallet_challenges"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_ownerId_idx" ON "organizations"("ownerId");

-- CreateIndex
CREATE INDEX "organizations_createdAt_idx" ON "organizations"("createdAt");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_role_idx" ON "organization_members"("organizationId", "role");

-- CreateIndex
CREATE INDEX "committees_organizationId_status_idx" ON "committees"("organizationId", "status");

-- CreateIndex
CREATE INDEX "committees_createdById_idx" ON "committees"("createdById");

-- CreateIndex
CREATE INDEX "committees_evaluationTemplateId_idx" ON "committees"("evaluationTemplateId");

-- CreateIndex
CREATE INDEX "committees_deadline_idx" ON "committees"("deadline");

-- CreateIndex
CREATE INDEX "projects_submittedById_idx" ON "projects"("submittedById");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "projects_committeeId_title_key" ON "projects"("committeeId", "title");

-- CreateIndex
CREATE INDEX "evaluation_templates_organizationId_isDefault_idx" ON "evaluation_templates"("organizationId", "isDefault");

-- CreateIndex
CREATE INDEX "evaluation_templates_createdById_idx" ON "evaluation_templates"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_templates_organizationId_title_version_key" ON "evaluation_templates"("organizationId", "title", "version");

-- CreateIndex
CREATE INDEX "evaluation_criteria_templateId_position_idx" ON "evaluation_criteria"("templateId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_criteria_templateId_key_key" ON "evaluation_criteria"("templateId", "key");

-- CreateIndex
CREATE INDEX "evaluations_committeeId_status_idx" ON "evaluations"("committeeId", "status");

-- CreateIndex
CREATE INDEX "evaluations_judgeId_status_idx" ON "evaluations"("judgeId", "status");

-- CreateIndex
CREATE INDEX "evaluations_submittedAt_idx" ON "evaluations"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_projectId_judgeId_key" ON "evaluations"("projectId", "judgeId");

-- CreateIndex
CREATE INDEX "evaluation_scores_criterionId_idx" ON "evaluation_scores"("criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_scores_evaluationId_criterionId_key" ON "evaluation_scores"("evaluationId", "criterionId");

-- CreateIndex
CREATE INDEX "evaluation_comments_evaluationId_idx" ON "evaluation_comments"("evaluationId");

-- CreateIndex
CREATE INDEX "evaluation_comments_criterionId_idx" ON "evaluation_comments"("criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_results_committeeId_key" ON "decision_results"("committeeId");

-- CreateIndex
CREATE INDEX "decision_results_winnerProjectId_idx" ON "decision_results"("winnerProjectId");

-- CreateIndex
CREATE INDEX "decision_results_status_publishedAt_idx" ON "decision_results"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_committeeId_createdAt_idx" ON "audit_logs"("committeeId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_tokenHash_key" ON "invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "invitations_organizationId_status_idx" ON "invitations"("organizationId", "status");

-- CreateIndex
CREATE INDEX "invitations_email_status_idx" ON "invitations"("email", "status");

-- CreateIndex
CREATE INDEX "invitations_expiresAt_idx" ON "invitations"("expiresAt");

-- CreateIndex
CREATE INDEX "invitations_invitedById_idx" ON "invitations"("invitedById");

-- CreateIndex
CREATE INDEX "invitations_acceptedById_idx" ON "invitations"("acceptedById");

-- AddForeignKey
ALTER TABLE "wallet_challenges" ADD CONSTRAINT "wallet_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_evaluationTemplateId_fkey" FOREIGN KEY ("evaluationTemplateId") REFERENCES "evaluation_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_templates" ADD CONSTRAINT "evaluation_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_templates" ADD CONSTRAINT "evaluation_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_criteria" ADD CONSTRAINT "evaluation_criteria_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "evaluation_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "evaluation_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_comments" ADD CONSTRAINT "evaluation_comments_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_comments" ADD CONSTRAINT "evaluation_comments_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "evaluation_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_results" ADD CONSTRAINT "decision_results_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_results" ADD CONSTRAINT "decision_results_winnerProjectId_fkey" FOREIGN KEY ("winnerProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
