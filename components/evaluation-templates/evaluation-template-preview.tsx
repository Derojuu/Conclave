"use client";

import { Check, Star, X } from "lucide-react";
import { useState } from "react";

import type { EvaluationScoreType } from "@/constants/evaluation-template";

type PreviewCriterion = {
  label: string;
  description: string;
  type: EvaluationScoreType;
  weight: number;
  minScore: number;
  maxScore: number;
};

type EvaluationTemplatePreviewProps = {
  title: string;
  description: string;
  instructions: string;
  deadline: string | null;
  criteria: PreviewCriterion[];
};

function formatScore(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

export function EvaluationTemplatePreview({
  title,
  description,
  instructions,
  deadline,
  criteria,
}: EvaluationTemplatePreviewProps) {
  const [scores, setScores] = useState<Record<number, number>>({});
  const weightedMinimum = criteria.reduce(
    (total, criterion) => total + criterion.minScore * criterion.weight,
    0,
  );
  const weightedMaximum = criteria.reduce(
    (total, criterion) => total + criterion.maxScore * criterion.weight,
    0,
  );
  const weightedScore = criteria.reduce(
    (total, criterion, index) =>
      total + (scores[index] ?? criterion.minScore) * criterion.weight,
    0,
  );

  return (
    <section aria-label="Evaluation preview">
      <div className="border-b border-black/[0.06] pb-6 dark:border-white/[0.06]">
        <p className="text-[8px] font-bold tracking-[0.14em] text-indigo-500 uppercase">
          Evaluator preview
        </p>
        <h2 className="mt-4 text-2xl font-bold text-zinc-950 uppercase sm:text-3xl dark:text-white">
          {title || "Untitled template"}
        </h2>
        {description ? (
          <p className="mt-4 max-w-3xl text-[10px] leading-6 text-zinc-500">
            {description}
          </p>
        ) : null}
        <div className="mt-6 grid gap-5 border-y border-black/[0.06] py-5 sm:grid-cols-3 dark:border-white/[0.06]">
          <div>
            <p className="text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              Criteria
            </p>
            <p className="mt-2 text-[10px] font-bold text-zinc-950 dark:text-white">
              {criteria.length}
            </p>
          </div>
          <div>
            <p className="text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              Weighted range
            </p>
            <p className="mt-2 text-[10px] font-bold text-zinc-950 dark:text-white">
              {formatScore(weightedMinimum)} - {formatScore(weightedMaximum)}
            </p>
          </div>
          <div>
            <p className="text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              Deadline
            </p>
            <p className="mt-2 text-[10px] font-bold text-zinc-950 dark:text-white">
              {deadline
                ? new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(deadline))
                : "No deadline"}
            </p>
          </div>
        </div>
        {instructions ? (
          <div className="mt-6 border-l-2 border-indigo-500 pl-4">
            <p className="text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
              Instructions
            </p>
            <p className="mt-2 text-[9px] leading-5 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
              {instructions}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 space-y-4">
        {criteria.map((criterion, index) => {
          const score = scores[index] ?? criterion.minScore;

          return (
            <article
              className="border border-black/[0.07] p-5 dark:border-white/[0.07]"
              key={`${criterion.label}-${index}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[8px] font-bold tracking-[0.1em] text-indigo-500 uppercase">
                    Criterion {index + 1}
                  </p>
                  <h3 className="mt-2 text-[11px] font-bold text-zinc-950 dark:text-white">
                    {criterion.label || "Unnamed criterion"}
                  </h3>
                  {criterion.description ? (
                    <p className="mt-2 max-w-2xl text-[9px] leading-5 text-zinc-500">
                      {criterion.description}
                    </p>
                  ) : null}
                </div>
                <span className="w-fit border border-black/[0.07] px-2.5 py-1.5 text-[7px] font-bold text-zinc-500 uppercase dark:border-white/[0.07]">
                  Weight {criterion.weight}
                </span>
              </div>

              <div className="mt-5">
                {criterion.type === "NUMERIC" ? (
                  <div className="grid gap-3 sm:grid-cols-[1fr_110px] sm:items-center">
                    <input
                      aria-label={`${criterion.label} score`}
                      className="accent-indigo-500"
                      max={criterion.maxScore}
                      min={criterion.minScore}
                      onChange={(event) =>
                        setScores((current) => ({
                          ...current,
                          [index]: Number(event.target.value),
                        }))
                      }
                      step="0.1"
                      type="range"
                      value={score}
                    />
                    <input
                      aria-label={`${criterion.label} numeric score`}
                      className="h-10 border border-black/[0.08] bg-black/[0.02] px-3 text-[10px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
                      max={criterion.maxScore}
                      min={criterion.minScore}
                      onChange={(event) =>
                        setScores((current) => ({
                          ...current,
                          [index]: Number(event.target.value),
                        }))
                      }
                      step="0.1"
                      type="number"
                      value={score}
                    />
                  </div>
                ) : criterion.type === "STAR" ? (
                  <div
                    aria-label={`${criterion.label} star score`}
                    className="flex flex-wrap gap-2"
                    role="group"
                  >
                    {Array.from(
                      {
                        length: Math.max(
                          1,
                          Math.min(10, Math.trunc(criterion.maxScore)),
                        ),
                      },
                      (_, starIndex) => starIndex + 1,
                    ).map((value) => (
                      <button
                        aria-label={`${value} stars`}
                        className={
                          value <= score
                            ? "text-amber-500"
                            : "text-zinc-300 dark:text-zinc-700"
                        }
                        key={value}
                        onClick={() =>
                          setScores((current) => ({
                            ...current,
                            [index]: value,
                          }))
                        }
                        type="button"
                      >
                        <Star
                          aria-hidden="true"
                          fill="currentColor"
                          size={20}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    aria-label={`${criterion.label} pass or fail score`}
                    className="grid grid-cols-2 gap-px bg-black/[0.08] dark:bg-white/[0.08]"
                    role="group"
                  >
                    <button
                      className={
                        score === 1
                          ? "flex min-h-11 items-center justify-center gap-2 bg-emerald-500 text-[8px] font-bold text-white uppercase"
                          : "flex min-h-11 items-center justify-center gap-2 bg-[#EBE8E1] text-[8px] font-bold text-zinc-500 uppercase dark:bg-[#111]"
                      }
                      onClick={() =>
                        setScores((current) => ({
                          ...current,
                          [index]: 1,
                        }))
                      }
                      type="button"
                    >
                      <Check aria-hidden="true" size={14} />
                      Pass
                    </button>
                    <button
                      className={
                        score === 0
                          ? "flex min-h-11 items-center justify-center gap-2 bg-rose-500 text-[8px] font-bold text-white uppercase"
                          : "flex min-h-11 items-center justify-center gap-2 bg-[#EBE8E1] text-[8px] font-bold text-zinc-500 uppercase dark:bg-[#111]"
                      }
                      onClick={() =>
                        setScores((current) => ({
                          ...current,
                          [index]: 0,
                        }))
                      }
                      type="button"
                    >
                      <X aria-hidden="true" size={14} />
                      Fail
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-y border-black/[0.06] py-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <p className="text-[8px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
          Preview weighted score
        </p>
        <p className="text-xl font-bold text-zinc-950 dark:text-white">
          {formatScore(weightedScore)}
          <span className="ml-2 text-[9px] font-normal text-zinc-500">
            / {formatScore(weightedMaximum)}
          </span>
        </p>
      </div>
    </section>
  );
}
