import "server-only";

import { headers } from "next/headers";

export async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? null,
    userAgent: headerStore.get("user-agent"),
  };
}
