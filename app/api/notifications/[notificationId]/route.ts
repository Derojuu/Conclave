import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResourceNotFoundError } from "@/lib/security/errors";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { notificationId } = await params;
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      const exists = await prisma.notification.findFirst({
        where: { id: notificationId, userId: user.id },
        select: { id: true },
      });
      if (!exists) {
        throw new ResourceNotFoundError("Notification not found.");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
