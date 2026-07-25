"use client";

import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type NotificationItem = {
  id: string;
  type: "INVITATION" | "CAMPAIGN" | "EVALUATION" | "RESULT" | "SYSTEM";
  title: string;
  body: string | null;
  href: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationListProps = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export function NotificationList({
  notifications,
  unreadCount,
}: NotificationListProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function markRead(notificationId: string) {
    setPending(notificationId);
    setMessage(null);
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH",
    });
    const result = (await response.json()) as { error?: string };

    setPending(null);
    if (!response.ok) {
      setMessage(result.error ?? "Notification could not be updated.");
      return;
    }
    router.refresh();
  }

  async function markAllRead() {
    setPending("all");
    setMessage(null);
    const response = await fetch("/api/notifications", { method: "PATCH" });
    const result = (await response.json()) as { error?: string };

    setPending(null);
    if (!response.ok) {
      setMessage(result.error ?? "Notifications could not be updated.");
      return;
    }
    router.refresh();
  }

  return (
    <section>
      <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <div>
          <p className="text-[12px] font-bold tracking-[0.1em] text-zinc-950 uppercase dark:text-white">
            Notification inbox
          </p>
          <p className="mt-2 text-[10px] text-zinc-500">
            {unreadCount} unread
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-black/[0.08] px-4 text-[10px] font-bold tracking-[0.08em] uppercase disabled:opacity-50 dark:border-white/[0.08]"
          disabled={unreadCount === 0 || pending !== null}
          onClick={markAllRead}
          type="button"
        >
          {pending === "all" ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={13} />
          ) : (
            <CheckCheck aria-hidden="true" size={13} />
          )}
          Mark all read
        </button>
      </div>

      {notifications.length ? (
        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
          {notifications.map((notification) => {
            const unread = notification.readAt === null;

            return (
              <article
                className="grid gap-4 py-5 sm:grid-cols-[40px_1fr_auto] sm:items-center"
                key={notification.id}
              >
                <span
                  className={
                    unread
                      ? "flex h-10 w-10 items-center justify-center border border-indigo-500/25 bg-indigo-500/[0.06] text-indigo-500"
                      : "flex h-10 w-10 items-center justify-center border border-black/[0.07] text-zinc-400 dark:border-white/[0.07]"
                  }
                >
                  <Bell aria-hidden="true" size={15} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12px] font-bold text-zinc-950 dark:text-white">
                      {notification.title}
                    </p>
                    {unread ? (
                      <span className="h-1.5 w-1.5 bg-indigo-500" />
                    ) : null}
                    <span className="text-[9px] font-bold tracking-[0.08em] text-zinc-500 uppercase">
                      {notification.type}
                    </span>
                  </div>
                  {notification.body ? (
                    <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                      {notification.body}
                    </p>
                  ) : null}
                  <time className="mt-2 block text-[9px] text-zinc-400 uppercase">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(notification.createdAt))}
                  </time>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  {unread ? (
                    <button
                      aria-label={`Mark ${notification.title} as read`}
                      className="flex h-9 w-9 items-center justify-center border border-black/[0.08] text-zinc-500 hover:border-indigo-500 hover:text-indigo-500 disabled:opacity-50 dark:border-white/[0.08]"
                      disabled={pending !== null}
                      onClick={() => markRead(notification.id)}
                      type="button"
                    >
                      {pending === notification.id ? (
                        <Loader2
                          aria-hidden="true"
                          className="animate-spin"
                          size={13}
                        />
                      ) : (
                        <Check aria-hidden="true" size={13} />
                      )}
                    </button>
                  ) : null}
                  <Link
                    aria-label={`Open ${notification.title}`}
                    className="flex h-9 w-9 items-center justify-center border border-black/[0.08] text-zinc-500 hover:border-indigo-500 hover:text-indigo-500 dark:border-white/[0.08]"
                    href={notification.href}
                  >
                    <ChevronRight aria-hidden="true" size={13} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center border-b border-black/[0.06] text-center dark:border-white/[0.06]">
          <Bell aria-hidden="true" className="text-zinc-400" size={20} />
          <p className="mt-4 text-[12px] text-zinc-500">
            No notifications have been recorded.
          </p>
        </div>
      )}

      {message ? (
        <p className="mt-4 text-[11px] text-rose-500" role="alert">
          {message}
        </p>
      ) : null}
    </section>
  );
}
