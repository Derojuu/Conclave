import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SUBMISSION_ATTACHMENT_BUCKET,
  SUBMISSION_ATTACHMENT_SIGNED_URL_SECONDS,
} from "@/utils/submission-attachment";

type StoredAttachment = {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: bigint;
  createdAt: Date;
};

export type DownloadableAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: string;
  createdAt: string;
  downloadUrl: string | null;
};

const STORAGE_DELETE_BATCH_SIZE = 100;

export async function removeSubmissionAttachmentObjects(
  storagePaths: string[],
  context: string,
) {
  const uniquePaths = [...new Set(storagePaths.filter(Boolean))];
  if (!uniquePaths.length) {
    return;
  }

  const storage = getSupabaseAdminClient().storage.from(
    SUBMISSION_ATTACHMENT_BUCKET,
  );

  for (
    let offset = 0;
    offset < uniquePaths.length;
    offset += STORAGE_DELETE_BATCH_SIZE
  ) {
    const batch = uniquePaths.slice(
      offset,
      offset + STORAGE_DELETE_BATCH_SIZE,
    );

    try {
      const { error } = await storage.remove(batch);
      if (error) {
        console.error(
          `Unable to remove submission attachment objects after deleting ${context}.`,
          { paths: batch, error },
        );
      }
    } catch (error) {
      console.error(
        `Unable to remove submission attachment objects after deleting ${context}.`,
        { paths: batch, error },
      );
    }
  }
}

export async function createDownloadableAttachments(
  attachments: StoredAttachment[],
): Promise<DownloadableAttachment[]> {
  const storage = getSupabaseAdminClient().storage.from(
    SUBMISSION_ATTACHMENT_BUCKET,
  );

  return Promise.all(
    attachments.map(async (attachment) => {
      const { data, error } = await storage.createSignedUrl(
        attachment.storagePath,
        SUBMISSION_ATTACHMENT_SIGNED_URL_SECONDS,
        { download: attachment.fileName },
      );

      if (error) {
        console.error(
          `Unable to sign submission attachment ${attachment.id}.`,
          error,
        );
      }

      return {
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes.toString(),
        createdAt: attachment.createdAt.toISOString(),
        downloadUrl: data?.signedUrl ?? null,
      };
    }),
  );
}
