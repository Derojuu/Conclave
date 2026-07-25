import type { Metadata } from "next";
import { Bell } from "lucide-react";
import Link from "next/link";

import { NotificationList } from "@/components/notifications/notification-list";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getPagination } from "@/lib/database";
import { getNotificationHref } from "@/lib/notification-links";
import { prisma } from "@/lib/prisma";
import { notificationQuerySchema } from "@/lib/validation/notification";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireAuthenticatedUser({ next: "/notifications" });
  const params = await searchParams;
  const input = notificationQuerySchema.parse({
    page: params.page,
    pageSize: 20,
  });
  const pagination = getPagination(input);
  const [records, total, unreadCount] = await Promise.all([
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
  const pages = Math.max(1, Math.ceil(total / pagination.pageSize));

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3">
        <Bell aria-hidden="true" className="text-indigo-500" size={16} />
        <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
          Account activity
        </p>
      </div>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        Notifications
      </h1>
      <p className="mt-4 max-w-2xl text-[13px] leading-6 text-zinc-500">
        Campaign assignments, confidential evaluation receipts, invitations,
        and verified decision updates.
      </p>

      <div className="mt-8 border-y border-black/[0.06] py-7 dark:border-white/[0.06]">
        <NotificationList
          notifications={records.map((notification) => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            href: getNotificationHref(notification),
            readAt: notification.readAt?.toISOString() ?? null,
            createdAt: notification.createdAt.toISOString(),
          }))}
          unreadCount={unreadCount}
        />
      </div>

      {pages > 1 ? (
        <nav
          aria-label="Notification pages"
          className="mt-6 flex items-center justify-between"
        >
          <Link
            aria-disabled={pagination.page <= 1}
            className={
              pagination.page <= 1
                ? "pointer-events-none text-[10px] font-bold text-zinc-300 uppercase dark:text-zinc-700"
                : "text-[10px] font-bold text-indigo-500 uppercase"
            }
            href={`/notifications?page=${Math.max(1, pagination.page - 1)}`}
          >
            Previous
          </Link>
          <span className="text-[10px] text-zinc-500">
            {pagination.page} / {pages}
          </span>
          <Link
            aria-disabled={pagination.page >= pages}
            className={
              pagination.page >= pages
                ? "pointer-events-none text-[10px] font-bold text-zinc-300 uppercase dark:text-zinc-700"
                : "text-[10px] font-bold text-indigo-500 uppercase"
            }
            href={`/notifications?page=${Math.min(pages, pagination.page + 1)}`}
          >
            Next
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
