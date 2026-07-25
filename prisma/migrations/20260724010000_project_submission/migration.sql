-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'FINALIST',
    'SELECTED',
    'REJECTED',
    'ARCHIVED'
);

-- AlterTable
ALTER TABLE "projects"
ADD COLUMN "category" VARCHAR(80) NOT NULL DEFAULT 'Uncategorized',
ADD COLUMN "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "githubUrl" TEXT,
ADD COLUMN "demoUrl" TEXT,
ADD COLUMN "videoUrl" TEXT;

ALTER TABLE "projects"
ALTER COLUMN "category" DROP DEFAULT;

-- CreateTable
CREATE TABLE "project_team_members" (
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "addedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_team_members_pkey"
    PRIMARY KEY ("projectId", "userId")
);

-- Existing submitters become the first team member for their projects.
INSERT INTO "project_team_members" (
    "projectId",
    "userId",
    "addedById",
    "createdAt"
)
SELECT
    "id",
    "submittedById",
    "submittedById",
    "createdAt"
FROM "projects"
ON CONFLICT ("projectId", "userId") DO NOTHING;

-- CreateIndex
CREATE INDEX "projects_committeeId_status_idx"
ON "projects"("committeeId", "status");

-- CreateIndex
CREATE INDEX "projects_committeeId_category_idx"
ON "projects"("committeeId", "category");

-- CreateIndex
CREATE INDEX "project_team_members_userId_createdAt_idx"
ON "project_team_members"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "project_team_members_addedById_idx"
ON "project_team_members"("addedById");

-- AddForeignKey
ALTER TABLE "project_team_members"
ADD CONSTRAINT "project_team_members_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members"
ADD CONSTRAINT "project_team_members_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members"
ADD CONSTRAINT "project_team_members_addedById_fkey"
FOREIGN KEY ("addedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
