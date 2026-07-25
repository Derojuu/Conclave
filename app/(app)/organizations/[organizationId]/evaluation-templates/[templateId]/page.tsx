import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";

import { EvaluationTemplateActions } from "@/components/evaluation-templates/evaluation-template-actions";
import { EvaluationTemplateBuilder } from "@/components/evaluation-templates/evaluation-template-builder";
import { ORGANIZATION_PERMISSIONS, roleHasPermission } from "@/constants/auth";
import type { EvaluationScoreType } from "@/constants/evaluation-template";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireEvaluationTemplatePermission } from "@/lib/security/evaluation-template-rbac";

export const metadata: Metadata = {
  title: "Evaluation template builder",
  robots: { index: false, follow: false },
};

function normalizeScoreType(type: string): EvaluationScoreType {
  if (type === "STAR") {
    return "STAR";
  }

  return type === "PASS_FAIL" || type === "BOOLEAN" ? "PASS_FAIL" : "NUMERIC";
}

export default async function EvaluationTemplateBuilderPage({
  params,
}: {
  params: Promise<{ organizationId: string; templateId: string }>;
}) {
  const { organizationId, templateId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/evaluation-templates/${templateId}`,
  });
  const access = await requireEvaluationTemplatePermission(
    user.id,
    organizationId,
    templateId,
    ORGANIZATION_PERMISSIONS.templatesRead,
  );
  const canManage =
    access.isSuperAdmin ||
    roleHasPermission(access.role, ORGANIZATION_PERMISSIONS.templatesManage);
  const template = await prisma.evaluationTemplate.findUniqueOrThrow({
    where: { id: templateId },
    select: {
      id: true,
      title: true,
      description: true,
      instructions: true,
      deadline: true,
      version: true,
      isDefault: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: { fullName: true, email: true },
      },
      organization: {
        select: { name: true, slug: true },
      },
      criteria: {
        orderBy: { position: "asc" },
        select: {
          label: true,
          description: true,
          type: true,
          weight: true,
          minScore: true,
          maxScore: true,
        },
      },
      campaigns: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
  const versions = await prisma.evaluationTemplate.findMany({
    where: {
      organizationId,
      title: template.title,
    },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      isDefault: true,
      updatedAt: true,
      _count: {
        select: { campaigns: true },
      },
    },
  });
  const editable = canManage && template.campaigns.length === 0;

  return (
    <div className="max-w-6xl">
      <Link
        className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase hover:text-indigo-500"
        href={`/organizations/${organizationId}/evaluation-templates`}
      >
        <ArrowLeft aria-hidden="true" size={12} />
        {template.organization.name} templates
      </Link>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] text-indigo-500 uppercase">
            {template.organization.slug} / version {template.version}
          </p>
          <h1 className="mt-4 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
            {template.title}
          </h1>
          <p className="mt-4 text-[11px] text-zinc-500">
            Created by {template.createdBy.fullName} /{" "}
            {template.createdBy.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {template.isDefault ? (
            <span className="inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2 text-[10px] font-bold text-emerald-500 uppercase">
              <CheckCircle2 aria-hidden="true" size={12} />
              Default
            </span>
          ) : null}
          {!editable ? (
            <span className="inline-flex items-center gap-2 border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-[10px] font-bold text-amber-500 uppercase">
              <LockKeyhole aria-hidden="true" size={12} />
              {canManage ? "Version locked" : "Read only"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_230px]">
        <main className="min-w-0">
          <EvaluationTemplateBuilder
            defaultValues={{
              title: template.title,
              description: template.description ?? "",
              instructions: template.instructions,
              deadline: template.deadline?.toISOString() ?? null,
              isDefault: template.isDefault,
              criteria: template.criteria.map((criterion) => ({
                label: criterion.label,
                description: criterion.description ?? "",
                type: normalizeScoreType(criterion.type),
                weight: Number(criterion.weight),
                minScore: Number(criterion.minScore),
                maxScore: Number(criterion.maxScore),
              })),
            }}
            editable={editable}
            organizationId={organizationId}
            templateId={templateId}
            version={template.version}
          />

          {canManage ? (
            <EvaluationTemplateActions
              canDelete={template.campaigns.length === 0}
              organizationId={organizationId}
              templateId={templateId}
              templateTitle={template.title}
              version={template.version}
            />
          ) : null}
        </main>

        <aside>
          <div className="border-y border-black/[0.06] py-5 dark:border-white/[0.06]">
            <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
              Version history
            </p>
            <div className="mt-4 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {versions.map((versionRecord) => (
                <Link
                  className={
                    versionRecord.id === templateId
                      ? "flex items-center justify-between py-3 text-indigo-500"
                      : "flex items-center justify-between py-3 text-zinc-500 hover:text-indigo-500"
                  }
                  href={`/organizations/${organizationId}/evaluation-templates/${versionRecord.id}`}
                  key={versionRecord.id}
                >
                  <span className="text-[11px] font-bold uppercase">
                    Version {versionRecord.version}
                  </span>
                  <span className="text-[9px] uppercase">
                    {versionRecord._count.campaigns > 0
                      ? "In use"
                      : versionRecord.isDefault
                        ? "Default"
                        : "Draft"}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-7 border-b border-black/[0.06] pb-6 dark:border-white/[0.06]">
            <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
              Template record
            </p>
            <p className="mt-4 flex items-center gap-2 text-[10px] text-zinc-500">
              <CalendarClock aria-hidden="true" size={12} />
              Updated{" "}
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(template.updatedAt)}
            </p>
            <p className="mt-3 text-[10px] text-zinc-500">
              Created{" "}
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
              }).format(template.createdAt)}
            </p>
          </div>

          <div className="mt-7">
            <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
              Campaign usage
            </p>
            {template.campaigns.length ? (
              <div className="mt-3 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {template.campaigns.map((campaign) => (
                  <Link
                    className="block py-3 hover:text-indigo-500"
                    href={`/organizations/${organizationId}/campaigns/${campaign.id}`}
                    key={campaign.id}
                  >
                    <p className="text-[10px] font-bold uppercase">
                      {campaign.title}
                    </p>
                    <p className="mt-1 text-[9px] text-zinc-500">
                      {campaign.status}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[10px] leading-5 text-zinc-500">
                This version is not assigned to a campaign and remains
                editable.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
