import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWalletChallenge } from "@/lib/wallet-challenge";

export async function GET() {
  try {
    const user = await requireApiUser();
    const challenge = createWalletChallenge(user.id);

    await prisma.$transaction([
      prisma.walletChallenge.deleteMany({
        where: {
          userId: user.id,
          OR: [{ expiresAt: { lte: new Date() } }, { usedAt: { not: null } }],
        },
      }),
      prisma.walletChallenge.create({
        data: {
          userId: user.id,
          nonceHash: challenge.nonceHash,
          expiresAt: challenge.expiresAt,
        },
      }),
    ]);

    return NextResponse.json({
      nonce: challenge.nonce,
      message: challenge.message,
      expiresAt: challenge.expiresAt,
    });
  } catch (error) {
    return apiError(error);
  }
}
