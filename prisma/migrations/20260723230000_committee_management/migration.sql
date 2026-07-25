-- Replace the legacy committee lifecycle while preserving current records.
CREATE TYPE "CommitteeStatus_new" AS ENUM (
    'DRAFT',
    'OPEN',
    'EVALUATING',
    'COMPLETED',
    'ARCHIVED'
);

ALTER TABLE "committees"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "committees"
ALTER COLUMN "status" TYPE "CommitteeStatus_new"
USING (
    CASE "status"::text
        WHEN 'DRAFT' THEN 'DRAFT'
        WHEN 'OPEN' THEN 'OPEN'
        WHEN 'COLLECTING' THEN 'EVALUATING'
        WHEN 'COMPUTING' THEN 'EVALUATING'
        WHEN 'PUBLISHED' THEN 'COMPLETED'
        WHEN 'ARCHIVED' THEN 'ARCHIVED'
    END
)::"CommitteeStatus_new";

DROP TYPE "CommitteeStatus";
ALTER TYPE "CommitteeStatus_new" RENAME TO "CommitteeStatus";

ALTER TABLE "committees"
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "committee_judges" (
    "committeeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assignedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_judges_pkey"
    PRIMARY KEY ("committeeId", "userId")
);

-- Backfill assignments for judges who already submitted evaluations.
INSERT INTO "committee_judges" (
    "committeeId",
    "userId",
    "assignedById",
    "createdAt"
)
SELECT DISTINCT
    evaluation."committeeId",
    evaluation."judgeId",
    committee."createdById",
    evaluation."createdAt"
FROM "evaluations" AS evaluation
INNER JOIN "committees" AS committee
    ON committee."id" = evaluation."committeeId"
ON CONFLICT ("committeeId", "userId") DO NOTHING;

-- CreateIndex
CREATE INDEX "committee_judges_userId_createdAt_idx"
ON "committee_judges"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "committee_judges_assignedById_idx"
ON "committee_judges"("assignedById");

-- AddForeignKey
ALTER TABLE "committee_judges"
ADD CONSTRAINT "committee_judges_committeeId_fkey"
FOREIGN KEY ("committeeId") REFERENCES "committees"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_judges"
ADD CONSTRAINT "committee_judges_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_judges"
ADD CONSTRAINT "committee_judges_assignedById_fkey"
FOREIGN KEY ("assignedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
