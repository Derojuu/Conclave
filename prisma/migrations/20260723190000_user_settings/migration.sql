-- CreateTable
CREATE TABLE "user_settings" (
    "userId" UUID NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "securityNotifications" BOOLEAN NOT NULL DEFAULT true,
    "decisionNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("userId")
);

-- Backfill settings for profiles created before this migration.
INSERT INTO "user_settings" ("userId", "updatedAt")
SELECT "id", CURRENT_TIMESTAMP
FROM "users"
ON CONFLICT ("userId") DO NOTHING;

-- AddForeignKey
ALTER TABLE "user_settings"
ADD CONSTRAINT "user_settings_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
