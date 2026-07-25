-- AlterTable
ALTER TABLE "organizations"
ADD COLUMN "logoPath" TEXT;

-- AlterTable
ALTER TABLE "user_settings"
ADD COLUMN "activeOrganizationId" UUID;

-- CreateIndex
CREATE INDEX "user_settings_activeOrganizationId_idx"
ON "user_settings"("activeOrganizationId");

-- AddForeignKey
ALTER TABLE "user_settings"
ADD CONSTRAINT "user_settings_activeOrganizationId_fkey"
FOREIGN KEY ("activeOrganizationId") REFERENCES "organizations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Create the public organization logo bucket used by the server upload route.
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'organization-logos',
    'organization-logos',
    true,
    2097152,
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
