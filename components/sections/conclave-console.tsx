"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icons";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { siteLinks } from "@/lib/site-links";
import { cn } from "@/utils/cn";

const stages = [
  "Submission encrypted",
  "Evaluator sealed",
  "Nox computation",
  "Receipt published",
  "Result verified",
] as const;

const blockRail = [
  { height: "481290", hash: "0x3f…a1" },
  { height: "481291", hash: "0x7c…b4" },
  { height: "481292", hash: "0xe2…09" },
  { height: "481293", hash: "0x1a…f7" },
] as const;

const packetPositions = [
  "left-0",
  "left-1/4",
  "left-1/2",
  "left-3/4",
  "right-0",
] as const;

const evaluators = [
  ["AK", "Amina K.", "DOMAIN EXPERT"],
  ["JL", "Jonas L.", "FEASIBILITY"],
  ["MR", "Mira R.", "IMPACT"],
  ["SO", "Samuel O.", "RISK"],
] as const;

export function ConclaveConsole() {
  const [stage, setStage] = useState(-1);
  const [blockConfs, setBlockConfs] = useState(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const confTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (stage !== stages.length - 1) {
      return;
    }

    confTimer.current = setInterval(
      () => setBlockConfs((confirmations) => confirmations + 1),
      900,
    );

    return () => {
      if (confTimer.current) {
        clearInterval(confTimer.current);
        confTimer.current = null;
      }
    };
  }, [stage]);

  function runSequence() {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (stage === stages.length - 1) {
      setStage(-1);
      setBlockConfs(0);
      return;
    }

    setStage(0);
    setBlockConfs(0);
    stages.slice(1).forEach((_, index) => {
      timers.current.push(
        setTimeout(() => {
          const nextStage = index + 1;
          setStage(nextStage);
          if (nextStage === stages.length - 1) {
            setBlockConfs(1);
          }
        }, (index + 1) * 720),
      );
    });
  }

  return (
    <div className="relative w-full overflow-hidden rounded-sm border border-black/[0.06] bg-[#EBE8E1] text-left shadow-[0_40px_100px_rgba(0,0,0,0.22)] dark:border-white/[0.07] dark:bg-[#111]">
      <div className="console-scanline pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-transparent via-indigo-500/[0.04] to-transparent" />

      <div className="relative z-10 flex h-12 items-center justify-between border-b border-black/[0.06] px-4 dark:border-white/[0.07] sm:px-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-zinc-500/60" />
          <span className="h-2 w-2 rounded-full bg-zinc-500/40" />
          <span className="h-2 w-2 rounded-full bg-zinc-500/20" />
        </div>
        <div className="text-[9px] font-bold tracking-[0.18em] text-zinc-500 uppercase">
          CONCLAVE / CONFIDENTIAL DECISION CONSOLE
        </div>
        <LiveIndicator
          className="hidden sm:flex"
          label={stage >= 2 ? "Nox computing" : "Nox ready"}
          tone={stage >= 2 && stage < 4 ? "amber" : "emerald"}
        />
      </div>

      <div className="relative z-10 grid lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative flex min-h-[650px] flex-col justify-between overflow-hidden border-b border-black/[0.06] p-6 lg:border-r lg:border-b-0 lg:p-10 xl:p-12 dark:border-white/[0.07]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800d_1px,transparent_1px),linear-gradient(to_bottom,#8080800d_1px,transparent_1px)] bg-[size:36px_36px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.03] px-3 py-1 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold tracking-[0.18em] text-zinc-500 uppercase">
                POWERED BY IEXEC NOX
              </span>
            </div>

            <h1 className="mt-10 max-w-[700px] text-5xl leading-[0.88] font-bold text-zinc-900 uppercase sm:text-6xl xl:text-7xl dark:text-white">
              THE CONFIDENTIAL DECISION INFRASTRUCTURE.
            </h1>

            <p className="mt-7 max-w-[560px] text-sm leading-relaxed text-zinc-500 sm:text-base">
              Sensitive evaluations stay encrypted while Conclave computes the
              approved outcome. Individual scores, comments, and identities are
              never exposed.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                className="button-primary inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-zinc-900 px-7 text-[10px] font-bold tracking-[0.18em] uppercase transition-colors hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200"
                onClick={runSequence}
                type="button"
              >
                {stage === stages.length - 1
                  ? "Reset sequence"
                  : stage >= 0
                    ? stages[stage]
                    : "Run confidential decision"}
                {stage >= 0 && stage < stages.length - 1 ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current/25 border-t-current" />
                ) : (
                  <Icon name="chevron-right" size={14} />
                )}
              </button>
              <a
                className="button-secondary inline-flex h-12 items-center justify-center rounded-sm border border-black/10 px-7 text-[10px] font-bold tracking-[0.18em] uppercase transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/[0.04]"
                href={siteLinks.product}
              >
                View workflow
              </a>
            </div>
          </div>

          <div className="relative z-10 mt-12 grid gap-px overflow-hidden border border-black/[0.07] bg-black/[0.07] sm:grid-cols-3 dark:border-white/[0.07] dark:bg-white/[0.07]">
            {[
              ["INPUTS", "Encrypted", "lock"],
              ["COMPUTE", "Confidential", "cpu"],
              ["OUTPUT", "Result only", "check"],
            ].map(([label, value, icon]) => (
              <div className="bg-[#EBE8E1] p-4 dark:bg-[#111]" key={label}>
                <Icon
                  className="mb-4 text-zinc-500"
                  name={icon as "lock" | "cpu" | "check"}
                  size={17}
                />
                <p className="text-[8px] tracking-[0.13em] text-zinc-500 uppercase">
                  {label}
                </p>
                <p className="mt-2 text-[11px] font-bold text-zinc-900 uppercase dark:text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex min-h-[650px] flex-col">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.07] sm:px-7">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-zinc-900 uppercase dark:text-white">
                RESEARCH GRANT SELECTION
              </p>
              <p className="mt-1 text-[8px] tracking-[0.12em] text-zinc-500 uppercase">
                CAMPAIGN / REVIEW 02
              </p>
            </div>
            <span
              className={cn(
                "border px-2 py-1 text-[8px] font-bold tracking-[0.1em] uppercase",
                stage === stages.length - 1
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-400",
              )}
            >
              {stage === stages.length - 1 ? "VERIFIED" : "COLLECTING"}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-5 sm:p-7">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[8px] tracking-[0.13em] text-zinc-500 uppercase">
                  EVALUATOR ACTIVITY
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                  {stage >= 0 ? "4 / 4" : "3 / 4"}
                </p>
              </div>
              <span className="text-[8px] text-zinc-500 uppercase">
                ALL INPUTS PRIVATE
              </span>
            </div>

            <div className="mt-5 space-y-2">
              {evaluators.map(([initials, name, role], index) => {
                const finalEvaluator = index === evaluators.length - 1;
                const sealed = !finalEvaluator || stage >= 1;

                return (
                  <div
                    className="flex items-center justify-between border border-black/[0.06] bg-black/[0.015] p-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
                    key={initials}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-bold text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                        {initials}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-900 uppercase dark:text-white">
                          {finalEvaluator && stage >= 1 ? "0x7C...92F" : name}
                        </p>
                        <p className="mt-1 text-[8px] text-zinc-500 uppercase">
                          {finalEvaluator && stage >= 1
                            ? "IDENTITY REDACTED"
                            : role}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-2 text-[8px] font-bold uppercase",
                        sealed ? "text-emerald-400" : "text-zinc-500",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          sealed
                            ? "bg-emerald-400"
                            : "bg-zinc-500 animate-pulse",
                        )}
                      />
                      {sealed ? "SEALED" : "PENDING"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 border border-black/[0.06] p-4 dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-bold tracking-[0.12em] text-zinc-500 uppercase">
                  CONFIDENTIAL PIPELINE
                </p>
                <span className="text-[8px] text-zinc-500">
                  {stage >= 0 ? stages[stage] : "AWAITING INPUT"}
                </span>
              </div>

              <div className="relative mt-6">
                <div className="absolute top-4 right-4 left-4 h-px bg-black/10 dark:bg-white/10" />
                <div
                  className={cn(
                    "proof-flow absolute top-4 left-4 h-px bg-gradient-to-r from-indigo-400 via-emerald-400 to-indigo-400 transition-[width] duration-700",
                    stage < 0
                      ? "w-0"
                      : stage === 0
                        ? "w-[10%]"
                        : stage === 1
                          ? "w-[28%]"
                          : stage === 2
                            ? "w-[50%]"
                            : stage === 3
                              ? "w-[72%]"
                              : "w-[calc(100%_-_2rem)]",
                  )}
                />
                {stage >= 0 ? (
                  <span
                    className={cn(
                      "absolute top-[11px] z-20 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)] transition-all duration-700",
                      packetPositions[stage],
                    )}
                  />
                ) : null}
                <div className="relative grid grid-cols-5">
                  {["INPUT", "SEAL", "NOX", "RECEIPT", "RESULT"].map(
                    (label, index) => (
                      <div className="flex flex-col items-center" key={label}>
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center border bg-[#EBE8E1] transition-colors duration-500 dark:bg-[#111]",
                            stage >= index
                              ? "border-emerald-400/40 text-emerald-400"
                              : "border-black/10 text-zinc-500 dark:border-white/10",
                          )}
                        >
                          {stage >= index ? (
                            <Icon name="check" size={13} />
                          ) : (
                            <span className="text-[8px]">0{index + 1}</span>
                          )}
                        </div>
                        <span className="mt-3 text-[7px] text-zinc-500">
                          {label}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "mt-auto border-t border-black/[0.06] pt-6 transition-opacity duration-500 dark:border-white/[0.06]",
                stage === stages.length - 1 ? "opacity-100" : "opacity-45",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] tracking-[0.13em] text-zinc-500 uppercase">
                    COMPUTED OUTCOME
                  </p>
                  <p className="mt-2 text-lg font-bold text-zinc-900 uppercase dark:text-white">
                    {stage === stages.length - 1
                      ? "NORTHSTAR / RECOMMENDED"
                      : "RESULT LOCKED"}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center border border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
                  <Icon
                    name={stage === stages.length - 1 ? "check" : "lock"}
                    size={18}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="relative z-10 flex items-center gap-2 overflow-hidden border-t border-black/[0.06] px-5 py-3 dark:border-white/[0.07]">
        <span className="shrink-0 text-[8px] tracking-[0.12em] text-zinc-500 uppercase">
          BLOCK RAIL
        </span>
        <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
          {blockRail.map((block, index) => {
            const isResultBlock = index === blockRail.length - 1;
            const settled = stage === stages.length - 1;
            return (
              <div
                className={cn(
                  "flex h-8 shrink-0 items-center gap-2 border px-2 text-[8px] font-bold transition-colors duration-500",
                  isResultBlock && settled
                    ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
                    : "border-black/[0.08] bg-black/[0.02] text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.02]",
                )}
                key={block.height}
              >
                <span className="tabular-nums">#{block.height}</span>
                <span className="hidden font-normal text-zinc-500 sm:inline">
                  {block.hash}
                </span>
                {isResultBlock && settled ? (
                  <span className="tabular-nums text-emerald-400">
                    {blockConfs} conf
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        <span className="hidden shrink-0 text-[8px] text-zinc-500 sm:block">
          GAS 21K · SESSION C-0291
        </span>
      </div>
    </div>
  );
}
