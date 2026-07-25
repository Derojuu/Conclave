import type { Metadata } from "next";
import { History, Search } from "lucide-react";
import Link from "next/link";

import { OrganizationNavigation } from "@/components/organizations/organization-navigation";
import { AUDIT_ACTIONS } from "@/constants/audit";
import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getPagination } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { requireOrganizationPermission } from "@/lib/security/rbac";
import { auditLogQuerySchema } from "@/lib/validation/audit";

export const metadata: Metadata = {
  title: "Organization audit log",
  robots: { index: false, follow: false },
};

function stringifyMetadata(metadata: unknown) {
  if (!metadata) return null;
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return null;
  }
}

export default async function OrganizationAuditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{
    page?: string;
    action?: string;
    entity?: string;
  }>;
}) {
  const { organizationId } = await params;
  const query = await searchParams;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/audit-logs`,
  });
  await requireOrganizationPermission(
    user.id,
    organizationId,
    ORGANIZATION_PERMISSIONS.auditLogsRead,
  );
  const input = auditLogQuerySchema.parse({
    page: query.page,
    pageSize: 25,
    action: query.action || undefined,
    entity: query.entity || undefined,
  });
  const pagination = getPagination(input);
  const where = {
    organizationId,
    ...(input.action ? { action: input.action } : {}),
    ...(input.entity
      ? {
          entityType: {
            contains: input.entity,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };
  const [organization, logs, total] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { name: true, slug: true },
    }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        actor: {
          select: { fullName: true, email: true },
        },
        campaign: {
          select: { id: true, title: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const queryString = (page: number) => {
    const values = new URLSearchParams({ page: String(page) });
    if (input.action) values.set("action", input.action);
    if (input.entity) values.set("entity", input.entity);
    return values.toString();
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3">
        <History aria-hidden="true" className="text-indigo-500" size={16} />
        <p className="text-[8px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
          {organization.slug} / integrity record
        </p>
      </div>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        Audit log
      </h1>
      <p className="mt-4 max-w-2xl text-[11px] leading-6 text-zinc-500">
        Administrative, campaign, submission, and confidential-computation
        events for {organization.name}.
      </p>
      <OrganizationNavigation
        canManageSettings
        canReadAudit
        organizationId={organizationId}
      />

      <form className="mt-7 grid gap-3 border-y border-black/[0.06] py-5 sm:grid-cols-[180px_1fr_auto] dark:border-white/[0.06]">
        <label className="sr-only" htmlFor="audit-action">
          Audit action
        </label>
        <select
          className="h-10 border border-black/[0.08] bg-transparent px-3 text-[8px] font-bold uppercase dark:border-white/[0.08]"
          defaultValue={input.action ?? ""}
          id="audit-action"
          name="action"
        >
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((action) => (
            <option key={action} value={action}>
              {action.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="audit-entity">
          Entity type
        </label>
        <input
          className="h-10 min-w-0 border border-black/[0.08] bg-black/[0.02] px-3 text-[9px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
          defaultValue={input.entity ?? ""}
          id="audit-entity"
          name="entity"
          placeholder="Filter entity type"
        />
        <button
          className="button-primary inline-flex h-10 items-center justify-center gap-2 bg-zinc-950 px-4 text-[8px] font-bold uppercase dark:bg-white"
          type="submit"
        >
          <Search aria-hidden="true" size={12} />
          Filter
        </button>
      </form>

      <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
        {logs.map((log) => {
          const metadata = stringifyMetadata(log.metadata);
          const confidentialActor = log.entityType === "Evaluation";

          return (
            <article className="grid gap-4 py-5 lg:grid-cols-[150px_1fr_220px]" key={log.id}>
              <div>
                <p
                  className={
                    log.action === "DELETE" ||
                    log.action === "REVOKE_INVITATION"
                      ? "text-[8px] font-bold text-rose-500 uppercase"
                      : log.action.includes("COMPUTATION") ||
                          log.action === "PUBLISH_RESULT"
                        ? "text-[8px] font-bold text-emerald-500 uppercase"
                        : "text-[8px] font-bold text-indigo-500 uppercase"
                  }
                >
                  {log.action.replaceAll("_", " ")}
                </p>
                <time className="mt-2 block text-[7px] leading-4 text-zinc-500">
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(log.createdAt)}
                </time>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-zinc-950 dark:text-white">
                  {log.entityType}
                </p>
                <p className="mt-2 truncate font-mono text-[7px] text-zinc-500">
                  {log.entityId ?? "No entity identifier"}
                </p>
                {log.campaign ? (
                  <Link
                    className="mt-2 inline-block text-[8px] text-indigo-500"
                    href={`/organizations/${organizationId}/campaigns/${log.campaign.id}`}
                  >
                    {log.campaign.title}
                  </Link>
                ) : null}
                {metadata ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[7px] font-bold text-zinc-500 uppercase">
                      Event metadata
                    </summary>
                    <pre className="mt-3 max-h-64 overflow-auto border border-black/[0.06] bg-black/[0.02] p-3 text-[7px] leading-4 whitespace-pre-wrap text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.02]">
                      {metadata}
                    </pre>
                  </details>
                ) : null}
              </div>
              <div className="text-[8px] leading-5 text-zinc-500">
                <p className="font-bold text-zinc-700 dark:text-zinc-300">
                  {confidentialActor
                    ? "Confidential evaluator"
                    : (log.actor?.fullName ?? "System")}
                </p>
                {!confidentialActor && log.actor?.email ? (
                  <p className="truncate">{log.actor.email}</p>
                ) : null}
                <p className="mt-2 truncate">{log.ipAddress ?? "No IP record"}</p>
                <p className="truncate">{log.userAgent ?? "No user agent"}</p>
              </div>
            </article>
          );
        })}
        {!logs.length ? (
          <p className="py-12 text-center text-[9px] text-zinc-500">
            No audit events match the current filters.
          </p>
        ) : null}
      </div>

      {pages > 1 ? (
        <nav
          aria-label="Audit log pages"
          className="mt-6 flex items-center justify-between"
        >
          <Link
            aria-disabled={pagination.page <= 1}
            className={
              pagination.page <= 1
                ? "pointer-events-none text-[8px] text-zinc-300 uppercase dark:text-zinc-700"
                : "text-[8px] font-bold text-indigo-500 uppercase"
            }
            href={`?${queryString(Math.max(1, pagination.page - 1))}`}
          >
            Previous
          </Link>
          <span className="text-[8px] text-zinc-500">
            {pagination.page} / {pages}
          </span>
          <Link
            aria-disabled={pagination.page >= pages}
            className={
              pagination.page >= pages
                ? "pointer-events-none text-[8px] text-zinc-300 uppercase dark:text-zinc-700"
                : "text-[8px] font-bold text-indigo-500 uppercase"
            }
            href={`?${queryString(Math.min(pages, pagination.page + 1))}`}
          >
            Next
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
