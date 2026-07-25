import { NextResponse } from "next/server";
import { verifyMessage } from "viem";

import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { normalizeWalletAddress, withTransaction } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { getRequestMetadata } from "@/lib/request-metadata";
import { AuthorizationError } from "@/lib/security/errors";
import { walletLinkSchema } from "@/lib/validation/auth";
import {
  buildWalletChallengeMessage,
  hashWalletNonce,
} from "@/lib/wallet-challenge";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = walletLinkSchema.parse(await request.json());
    const address = normalizeWalletAddress(input.address);
    const nonceHash = hashWalletNonce(input.nonce);
    const challenge = await prisma.walletChallenge.findUnique({
      where: { nonceHash },
    });

    if (
      !challenge ||
      challenge.userId !== user.id ||
      challenge.usedAt ||
      challenge.expiresAt <= new Date()
    ) {
      throw new AuthorizationError("The wallet challenge is invalid or expired.");
    }

    const verified = await verifyMessage({
      address: address as `0x${string}`,
      message: buildWalletChallengeMessage(
        user.id,
        input.nonce,
        challenge.expiresAt,
      ),
      signature: input.signature as `0x${string}`,
    });

    if (!verified) {
      throw new AuthorizationError("The wallet signature is invalid.");
    }

    const existing = await prisma.user.findUnique({
      where: { walletAddress: address },
      select: { id: true },
    });

    if (existing && existing.id !== user.id) {
      return NextResponse.json(
        { error: "This wallet is already linked to another account." },
        { status: 409 },
      );
    }

    const metadata = await getRequestMetadata();
    const profile = await withTransaction(async (transaction) => {
      const consumed = await transaction.walletChallenge.updateMany({
        where: {
          id: challenge.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (consumed.count !== 1) {
        throw new AuthorizationError(
          "The wallet challenge has already been used.",
        );
      }

      const updated = await transaction.user.update({
        where: { id: user.id },
        data: { walletAddress: address },
        select: { walletAddress: true },
      });

      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: "CONNECT_WALLET",
          entityType: "User",
          entityId: user.id,
          metadata: { address },
          ...metadata,
        },
      });

      return updated;
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireApiUser();
    const metadata = await getRequestMetadata();

    await withTransaction(async (transaction) => {
      await transaction.user.update({
        where: { id: user.id },
        data: { walletAddress: null },
      });
      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: "UPDATE",
          entityType: "User",
          entityId: user.id,
          metadata: { walletDisconnected: true },
          ...metadata,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
