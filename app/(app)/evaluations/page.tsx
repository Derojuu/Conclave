import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";

import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Evaluation workspace",
  robots: { index: false, follow: false },
};

export default async function EvaluationsPage() {
  const user = await requireAuthenticatedUser({ next: "/evaluations" });
  const assignments = await prisma.campaignEvaluator.findMany({
    where: { userId: user.id },
    orderBy: { campaign: { deadline: "asc" } },
    select: {
      campaign: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          deadline: true,
          organizationId: true,
          organization: {
            select: { name: true },
          },
          evaluationTemplate: {
            select: { title: true, version: true },
          },
          submissions: {
            where: {
              status: {
                notIn: ["DRAFT", "WITHDRAWN", "ARCHIVED"],
              },
            },
            orderBy: { title: "asc" },
            select: {
              id: true,
              title: true,
              kind: true,
              status: true,
              evaluations: {
                where: { evaluatorId: user.id },
                select: {
                  status: true,
                  submittedAt: true,
                  payload: {
                    select: { sealedAt: true },
                  },
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
  const campaigns = assignments.map((assignment) => assignment.campaign);
  const submissionCount = campaigns.reduce(
    (total, campaign) => total + campaign.submissions.length,
    0,
  );
  const submittedCount = campaigns.reduce(
    (total, campaign) =>
      total +
      campaign.submissions.filter((submission) =>
        ["SUBMITTED", "INCLUDED"].includes(
          submission.evaluations[0]?.status ?? "",
        ),
      ).length,
    0,
  );

  return (
    <div className="max-w-6xl">
      <header>
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 bg-emerald-500" />
          <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
            Private evaluator workspace
          </p>
        </div>
        <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
          Assigned evaluations
        </h1>
        <p className="mt-4 max-w-2xl text-[12px] leading-6 text-zinc-500">
          Complete independent assessments. Your scores, recommendation, and
          comments are encrypted in the browser before submission.
        </p>
      </header>

      <section className="mt-9 grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] sm:grid-cols-3 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {[
          {
            label: "Assigned campaigns",
            value: campaigns.length,
            icon: ClipboardCheck,
          },
          {
            label: "Submission assignments",
            value: submissionCount,
            icon: LockKeyhole,
          },
          {
            label: "Submitted",
            value: submittedCount,
            icon: CheckCircle2,
          },
        ].map((stat) => (
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

      <div className="mt-10 space-y-10">
        {campaigns.length ? (
          campaigns.map((campaign) => (
            <section key={campaign.id}>
              <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.06]">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.1em] text-indigo-500 uppercase">
                    {campaign.organization.name}
                  </p>
                  <h2 className="mt-2 text-[15px] font-bold break-words text-zinc-950 dark:text-white">
                    {campaign.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-[11px] leading-5 text-zinc-500">
                    {campaign.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold text-zinc-950 uppercase dark:text-white">
                    {campaign.status.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-[9px] text-zinc-500">
                    <CalendarClock aria-hidden="true" size={11} />
                    {campaign.deadline
                      ? new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(campaign.deadline)
                      : "No campaign deadline"}
                  </p>
                </div>
              </div>

              {campaign.submissions.length ? (
                <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {campaign.submissions.map((submission) => {
                    const evaluation = submission.evaluations[0];
                    const complete =
                      evaluation?.status === "SUBMITTED" ||
                      evaluation?.status === "INCLUDED";

                    return (
                      <Link
                        className="group grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
                        href={`/organizations/${campaign.organizationId}/campaigns/${campaign.id}/submissions/${submission.id}/evaluate`}
                        key={submission.id}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-[13px] font-bold break-words text-zinc-950 group-hover:text-indigo-500 dark:text-white">
                              {submission.title}
                            </p>
                            {submission.kind ? (
                              <span className="text-[9px] text-zinc-500 uppercase">
                                {submission.kind}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-[10px] text-zinc-500">
                            {complete
                              ? "Submitted and sealed"
                              : evaluation?.status === "SEALED"
                                ? "Encrypted draft checkpoint saved"
                                : "Not yet submitted"}
                          </p>
                        </div>
                        <span
                          className={
                            complete
                              ? "inline-flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase"
                              : "inline-flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase"
                          }
                        >
                          {complete ? "View receipt" : "Evaluate"}
                          <ArrowRight aria-hidden="true" size={12} />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-[11px] text-zinc-500">
                  No submissions are currently available for evaluation.
                </p>
              )}
            </section>
          ))
        ) : (
          <div className="border-y border-black/[0.06] py-14 text-center dark:border-white/[0.06]">
            <ClipboardCheck
              aria-hidden="true"
              className="mx-auto text-zinc-500"
              size={22}
            />
            <p className="mt-4 text-[12px] text-zinc-500">
              You do not have any campaign assignments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
