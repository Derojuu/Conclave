-- ExtendEnum
ALTER TYPE "CriterionType" ADD VALUE IF NOT EXISTS 'STAR';
ALTER TYPE "CriterionType" ADD VALUE IF NOT EXISTS 'PASS_FAIL';

-- AlterTable
ALTER TABLE "evaluation_templates"
ADD COLUMN "instructions" TEXT NOT NULL DEFAULT '',
ADD COLUMN "deadline" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "evaluation_templates_organizationId_updatedAt_idx"
ON "evaluation_templates"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "evaluation_templates_organizationId_deadline_idx"
ON "evaluation_templates"("organizationId", "deadline");

-- Keep only the most recently updated default before enforcing uniqueness.
WITH "ranked_defaults" AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "organizationId"
            ORDER BY "updatedAt" DESC, "id" DESC
        ) AS "position"
    FROM "evaluation_templates"
    WHERE "isDefault" = TRUE
)
UPDATE "evaluation_templates" AS "template"
SET "isDefault" = FALSE
FROM "ranked_defaults"
WHERE
    "template"."id" = "ranked_defaults"."id"
    AND "ranked_defaults"."position" > 1;

-- Enforce one default template version per organization.
CREATE UNIQUE INDEX "evaluation_templates_one_default_per_organization_idx"
ON "evaluation_templates"("organizationId")
WHERE "isDefault" = TRUE;
