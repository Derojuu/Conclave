import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { EvaluationTemplateBuilder } from "@/components/evaluation-templates/evaluation-template-builder";
import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireOrganizationPermission } from "@/lib/security/rbac";

export const metadata: Metadata = {
  title: "New evaluation template",
  robots: { index: false, follow: false },
};

export default async function NewEvaluationTemplatePage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const user = await requireAuthenticatedUser({
    next: `/organizations/${organizationId}/evaluation-templates/new`,
  });
  const access = await requireOrganizationPermission(
    user.id,
    organizationId,
    ORGANIZATION_PERMISSIONS.templatesManage,
  );

  return (
    <div className="max-w-5xl">
      <Link
        className="inline-flex items-center gap-2 text-[8px] font-bold tracking-[0.1em] text-zinc-500 uppercase hover:text-indigo-500"
        href={`/organizations/${organizationId}/evaluation-templates`}
      >
        <ArrowLeft aria-hidden="true" size={12} />
        Evaluation templates
      </Link>
      <p className="mt-7 text-[8px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
        {access.organization.slug} / template builder
      </p>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        Create evaluation template
      </h1>
      <p className="mt-4 max-w-2xl text-[11px] leading-6 text-zinc-500">
        Define instructions, score ranges, criterion weights, and the exact
        framework evaluators will use.
      </p>
      <section className="mt-10">
        <EvaluationTemplateBuilder editable organizationId={organizationId} />
      </section>
    </div>
  );
}
