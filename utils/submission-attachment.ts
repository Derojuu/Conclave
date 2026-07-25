export const SUBMISSION_ATTACHMENT_BUCKET = "submission-attachments";
export const SUBMISSION_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;
export const SUBMISSION_ATTACHMENT_MAX_FILES = 20;
export const SUBMISSION_ATTACHMENT_SIGNED_URL_SECONDS = 5 * 60;

export const SUBMISSION_ATTACHMENT_TYPES = {
  "application/pdf": ["pdf"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
  "text/plain": ["txt"],
  "text/csv": ["csv"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "docx",
  ],
  "application/vnd.ms-excel": ["xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.ms-powerpoint": ["ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    "pptx",
  ],
  "application/zip": ["zip"],
  "application/x-zip-compressed": ["zip"],
} as const;

export function getSubmissionAttachmentExtension(file: File) {
  const allowedExtensions =
    SUBMISSION_ATTACHMENT_TYPES[
      file.type as keyof typeof SUBMISSION_ATTACHMENT_TYPES
    ];
  const extension = file.name.split(".").pop()?.trim().toLowerCase();

  if (!allowedExtensions || !extension) {
    return null;
  }

  return (allowedExtensions as readonly string[]).includes(extension)
    ? extension
    : null;
}

export function normalizeSubmissionAttachmentFileName(value: string) {
  const normalized = value
    .replaceAll("\\", "/")
    .split("/")
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();

  return (normalized || "attachment").slice(0, 255);
}
