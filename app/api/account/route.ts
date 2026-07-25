import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { withTransaction } from "@/lib/database";
import { getRequestMetadata } from "@/lib/request-metadata";
import { profileSchema } from "@/lib/validation/auth";

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const input = profileSchema.parse(await request.json());
    const metadata = await getRequestMetadata();
    const profile = await withTransaction(async (transaction) => {
      const updated = await transaction.user.update({
        where: { id: user.id },
        data: {
          fullName: input.fullName,
          avatar: input.avatar || null,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          walletAddress: true,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: "UPDATE",
          entityType: "User",
          entityId: user.id,
          metadata: {
            profileUpdated: true,
            avatarUpdated: user.avatar !== updated.avatar,
          },
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
