import type { Metadata } from "next";
import {
  ArrowRight,
  ClipboardList,
  FileCheck2,
  GitBranch,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { OrganizationNavigation } from "@/components/organizations/organization-navigation";
import { ORGANIZATION_PERMISSIONS, roleHasPermission } from "@/constants/auth";
import {
  evaluationScoreTypeLabels,
  type EvaluationScoreType,
} from "@/constants/evaluation-template";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrganizationPermission } from "@/lib/security/rbac";

export const metadata: Metadata = {
  title: "Evaluation templates",
  robots: { index: false, follow: false },
};

function normalizeScoreType(type: string): EvaluationScoreType {
  if (type === "STAR") {
    return "STAR";
  }

  return type === "PASS_FAIL" || type === "BOOLEAN" ? "PASS_FAIL" : "NUMERIC";
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

export default async function EvaluationTemplatesPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/evaluation-templates`,
  });
  const access = await requireOrganizationPermission(
    user.id,
    organizationId,
    ORGANIZATION_PERMISSIONS.templatesRead,
  );
  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.templatesManage);
  const canManageSettings =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.update);
  const templates = await prisma.evaluationTemplate.findMany({
    where: { organizationId },
    orderBy: [{ title: "asc" }, { version: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      version: true,
      isDefault: true,
      deadline: true,
      updatedAt: true,
      criteria: {
        orderBy: { position: "asc" },
        select: {
          type: true,
          weight: true,
          minScore: true,
          maxScore: true,
        },
      },
      _count: {
        select: {
          criteria: true,
          campaigns: true,
        },
      },
    },
  });
  const families = new Set(templates.map((template) => template.title)).size;
  const inUse = templates.filter(
    (template) => template._count.campaigns > 0,
  ).length;
  const latestTemplateIds = new Set<string>();
  const seenTitles = new Set<string>();

  templates.forEach((template) => {
    if (!seenTitles.has(template.title)) {
      latestTemplateIds.add(template.id);
      seenTitles.add(template.title);
    }
  });

  const stats = [
    { label: "Template families", value: families, icon: ClipboardList },
    { label: "Total versions", value: templates.length, icon: GitBranch },
    { label: "Versions in use", value: inUse, icon: ShieldCheck },
    {
      label: "Total criteria",
      value: templates.reduce(
        (total, template) => total + template._count.criteria,
        0,
      ),
      icon: FileCheck2,
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
            {access.organization.slug} / evaluation system
          </p>
          <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
            Evaluation templates
          </h1>
          <p className="mt-4 max-w-2xl text-[13px] leading-6 text-zinc-500">
            Build reusable, weighted evaluation frameworks and assign a fixed
            version to each campaign.
          </p>
        </div>
        {canManage ? (
          <Link
            className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[10px] font-bold tracking-[0.1em] uppercase dark:bg-white"
            href={`/organizations/${organizationId}/evaluation-templates/new`}
          >
            <Plus aria-hidden="true" size={14} />
            New template
          </Link>
        ) : null}
      </div>

      <OrganizationNavigation
        canManageSettings={canManageSettings}
        canReadAudit={canManageSettings}
        organizationId={organizationId}
      />

      <section className="mt-8 grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 xl:grid-cols-4 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {stats.map((stat) => (
          <article className="bg-[#EBE8E1] p-5 dark:bg-[#111]" key={stat.label}>
            <stat.icon aria-hidden="true" className="text-zinc-500" size={17} />
            <p className="mt-7 text-3xl font-bold text-zinc-950 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-2 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              {stat.label}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
            Template library
          </h2>
          <span className="text-[10px] text-zinc-500">
            {templates.length} VERSIONS
          </span>
        </div>

        {templates.length ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {templates.map((template) => {
              const minimum = template.criteria.reduce(
                (total, criterion) =>
                  total + Number(criterion.minScore) * Number(criterion.weight),
                0,
              );
              const maximum = template.criteria.reduce(
                (total, criterion) =>
                  total + Number(criterion.maxScore) * Number(criterion.weight),
                0,
              );
              const scoreTypes = Array.from(
                new Set(
                  template.criteria.map((criterion) =>
                    normalizeScoreType(criterion.type),
                  ),
                ),
              );

              return (
                <Link
                  className="group grid gap-5 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
                  href={`/organizations/${organizationId}/evaluation-templates/${template.id}`}
                  key={template.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <ClipboardList
                        aria-hidden="true"
                        className="text-zinc-500"
                        size={15}
                      />
                      <h3 className="text-[12px] font-bold text-zinc-950 uppercase group-hover:text-indigo-500 dark:text-white">
                        {template.title}
                      </h3>
                      <span className="border border-black/[0.07] px-2 py-1 text-[9px] font-bold text-zinc-500 uppercase dark:border-white/[0.07]">
                        v{template.version}
                      </span>
                      {latestTemplateIds.has(template.id) ? (
                        <span className="border border-indigo-500/20 bg-indigo-500/[0.04] px-2 py-1 text-[9px] font-bold text-indigo-500 uppercase">
                          Latest
                        </span>
                      ) : null}
                      {template.isDefault ? (
                        <span className="border border-emerald-500/20 bg-emerald-500/[0.04] px-2 py-1 text-[9px] font-bold text-emerald-500 uppercase">
                          Default
                        </span>
                      ) : null}
                      {template._count.campaigns > 0 ? (
                        <span className="border border-amber-500/20 bg-amber-500/[0.04] px-2 py-1 text-[9px] font-bold text-amber-500 uppercase">
                          Locked
                        </span>
                      ) : null}
                    </div>
                    {template.description ? (
                      <p className="mt-3 line-clamp-2 max-w-3xl text-[11px] leading-5 text-zinc-500">
                        {template.description}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[9px] tracking-[0.08em] text-zinc-500 uppercase">
                      <span>{template._count.criteria} criteria</span>
                      <span>
                        Range {formatNumber(minimum)} - {formatNumber(maximum)}
                      </span>
                      <span>
                        {scoreTypes
                          .map((type) => evaluationScoreTypeLabels[type])
                          .join(" / ") || "No score types"}
                      </span>
                      <span>{template._count.campaigns} campaigns</span>
                      <span>
                        Updated{" "}
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                        }).format(template.updatedAt)}
                      </span>
                      {template.deadline ? (
                        <span>
                          Due{" "}
                          {new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                          }).format(template.deadline)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="text-zinc-500 group-hover:text-indigo-500"
                    size={15}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center">
            <ClipboardList
              aria-hidden="true"
              className="mx-auto text-zinc-500"
              size={21}
            />
            <p className="mt-4 text-[12px] text-zinc-500">
              {canManage
                ? "Create the first reusable evaluation template."
                : "No evaluation templates are available."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
