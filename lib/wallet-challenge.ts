import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const WALLET_CHALLENGE_TTL_MINUTES = 10;

export function createWalletChallenge(userId: string) {
  const nonce = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + WALLET_CHALLENGE_TTL_MINUTES * 60 * 1000,
  );
  const message = buildWalletChallengeMessage(userId, nonce, expiresAt);

  return {
    nonce,
    nonceHash: hashWalletNonce(nonce),
    expiresAt,
    message,
  };
}

export function buildWalletChallengeMessage(
  userId: string,
  nonce: string,
  expiresAt: Date,
) {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    "Conclave wallet connection",
    "",
    `User: ${userId}`,
    `Origin: ${origin}`,
    `Nonce: ${nonce}`,
    `Expires: ${expiresAt.toISOString()}`,
    "",
    "Signing confirms ownership of this wallet. It does not submit a transaction.",
  ].join("\n");
}

export function hashWalletNonce(nonce: string) {
  return createHash("sha256").update(nonce).digest("hex");
}
