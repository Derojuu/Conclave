import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createInvitationToken() {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashInvitationToken(token),
  };
}

export function getInvitationUrl(token: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl.replace(/\/$/, "")}/invitations/${token}`;
}
