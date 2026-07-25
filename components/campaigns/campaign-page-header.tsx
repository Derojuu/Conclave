import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import type { CampaignStatus } from "@/constants/campaign";

type CampaignPageHeaderProps = {
  organizationId: string;
  organizationName: string;
  title: string;
  status: CampaignStatus;
  description?: string;
};

export function CampaignPageHeader({
  organizationId,
  organizationName,
  title,
  status,
  description,
}: CampaignPageHeaderProps) {
  return (
    <header>
      <Link
        className="inline-flex items-center gap-2 text-[8px] font-bold tracking-[0.1em] text-zinc-500 uppercase hover:text-indigo-500"
        href={`/organizations/${organizationId}/campaigns`}
      >
        <ArrowLeft aria-hidden="true" size={12} />
        {organizationName} campaigns
      </Link>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-3xl text-[11px] leading-6 text-zinc-500">
              {description}
            </p>
          ) : null}
        </div>
        <CampaignStatusBadge status={status} />
      </div>
    </header>
  );
}
