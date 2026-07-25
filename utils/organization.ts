export const ORGANIZATION_LOGO_BUCKET = "organization-logos";
export const ORGANIZATION_LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const ORGANIZATION_LOGO_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export function generateOrganizationSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
