import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { SubmissionStatusBadge } from "@/components/submissions/submission-status-badge";
import type { SubmissionStatus } from "@/constants/submission";

type SubmissionPageHeaderProps = {
  organizationId: string;
  campaignId: string;
  campaignTitle: string;
  title: string;
  kind: string | null;
  status: SubmissionStatus;
  description?: string;
};

export function SubmissionPageHeader({
  organizationId,
  campaignId,
  campaignTitle,
  title,
  kind,
  status,
  description,
}: SubmissionPageHeaderProps) {
  return (
    <header>
      <Link
        className="inline-flex max-w-full min-w-0 items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase hover:text-indigo-500"
        href={`/organizations/${organizationId}/campaigns/${campaignId}/submissions`}
      >
        <ArrowLeft aria-hidden="true" className="shrink-0" size={12} />
        <span className="min-w-0 break-words">{campaignTitle} submissions</span>
      </Link>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {kind ? (
            <p className="text-[10px] font-bold tracking-[0.12em] break-words text-indigo-500 uppercase">
              {kind}
            </p>
          ) : null}
          <h1 className="mt-3 text-3xl font-bold break-words text-zinc-950 uppercase sm:text-4xl dark:text-white">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-3xl text-[13px] leading-6 text-zinc-500">
              {description}
            </p>
          ) : null}
        </div>
        <SubmissionStatusBadge status={status} />
      </div>
    </header>
  );
}
