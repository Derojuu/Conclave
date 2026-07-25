import type { Metadata } from "next";

import { OrganizationForm } from "@/components/organizations/organization-form";

export const metadata: Metadata = {
  title: "New organization",
  robots: { index: false, follow: false },
};

export default function NewOrganizationPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 bg-emerald-500" />
        <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
          Organization setup
        </p>
      </div>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        Create an organization
      </h1>
      <p className="mt-4 max-w-2xl text-[13px] leading-6 text-zinc-500">
        You become the organization owner and can invite administrators and
        evaluators after creation.
      </p>
      <section className="mt-10 border-y border-black/[0.06] py-8 dark:border-white/[0.06]">
        <OrganizationForm />
      </section>
    </div>
  );
}
