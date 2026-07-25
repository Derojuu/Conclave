import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { withTransaction } from "@/lib/database";
import { getRequestMetadata } from "@/lib/request-metadata";
import { personalSettingsSchema } from "@/lib/validation/auth";

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const input = personalSettingsSchema.parse(await request.json());
    const metadata = await getRequestMetadata();

    const settings = await withTransaction(async (transaction) => {
      const updated = await transaction.userSettings.upsert({
        where: { userId: user.id },
        update: input,
        create: {
          userId: user.id,
          ...input,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: "UPDATE",
          entityType: "UserSettings",
          entityId: user.id,
          metadata: input,
          ...metadata,
        },
      });

      return updated;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return apiError(error);
  }
}
