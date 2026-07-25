import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { getPagination } from "@/lib/database";
import { getNotificationHref } from "@/lib/notification-links";
import { prisma } from "@/lib/prisma";
import { notificationQuerySchema } from "@/lib/validation/notification";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const url = new URL(request.url);
    const input = notificationQuerySchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    const pagination = getPagination(input);
    const [records, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.notification.count({ where: { userId: user.id } }),
      prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
    ]);

    return NextResponse.json({
      notifications: records.map((notification) => ({
        ...notification,
        href: getNotificationHref(notification),
      })),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        pages: Math.max(1, Math.ceil(total / pagination.pageSize)),
      },
      unread,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH() {
  try {
    const user = await requireApiUser();
    const result = await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    return apiError(error);
  }
}
