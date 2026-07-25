"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icons";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/utils/cn";

type DemoPhase = "collecting" | "computing" | "revealed";

const evaluators = [
  ["AK", "Amina K.", "Domain expert"],
  ["JL", "Jonas L.", "Feasibility"],
  ["MR", "Mira R.", "Impact"],
  ["SO", "Samuel O.", "Risk"],
] as const;

const submissions = [
  ["Northstar", "Distributed diagnostics research proposal"],
  ["Helix", "Clinical data interoperability study"],
  ["Vector", "Public-health forecasting initiative"],
] as const;

const receiptBlocks = ["ENC", "NOX", "RCPT", "ETH"] as const;

export function InteractiveDemoSection() {
  const [phase, setPhase] = useState<DemoPhase>("collecting");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function runDemo() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (phase === "revealed") {
      setPhase("collecting");
      return;
    }

    setPhase("computing");
    timerRef.current = setTimeout(() => {
      setPhase("revealed");
    }, 1800);
  }

  const allSubmitted = phase !== "collecting";
  const isRevealed = phase === "revealed";

  return (
    <section
      className="border-y border-black/[0.06] py-20 dark:border-white/[0.06]"
      id="demo"
    >
      <SectionHeading
        align="center"
        description="Watch four evaluators submit independently. Their assessments remain sealed while Conclave computes the approved final decision."
        eyebrow="Interactive demo"
        title="See a confidential evaluation in motion."
      />

      <div className="mt-12 overflow-hidden rounded-sm border border-black/[0.06] bg-[#EBE8E1] shadow-[0_35px_90px_rgba(0,0,0,0.14)] dark:border-white/[0.07] dark:bg-[#111]">
        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-black/[0.06] px-5 py-3 dark:border-white/[0.06]">
          <div>
            <p className="text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
              Research Grant 2026 / Final review
            </p>
            <p className="mt-1 text-[10px] tracking-[0.12em] text-zinc-500 uppercase">
              Campaign session C-0291
            </p>
          </div>
          <LiveIndicator
            label={
              phase === "computing"
                ? "Nox computing"
                : isRevealed
                  ? "Result verified"
                  : "Collecting inputs"
            }
            tone={phase === "collecting" ? "amber" : "emerald"}
          />
        </div>

        <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-black/[0.06] p-5 lg:border-r lg:border-b-0 dark:border-white/[0.06] sm:p-7">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-[0.13em] text-zinc-500 uppercase">
                  Evaluator activity
                </p>
                <p className="mt-2 text-2xl font-bold text-zinc-950 dark:text-white">
                  {allSubmitted ? "4 / 4" : "3 / 4"}
                </p>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase">
                Inputs remain hidden
              </span>
            </div>

            <div className="mt-6 space-y-2">
              {evaluators.map(([initials, name, role], index) => {
                const finalEvaluator = index === evaluators.length - 1;
                const sealed = !finalEvaluator || allSubmitted;

                return (
                  <div
                    className="flex items-center justify-between border border-black/[0.06] bg-black/[0.015] p-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
                    key={initials}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-black/[0.08] text-[10px] font-bold text-zinc-600 dark:border-white/[0.08] dark:text-zinc-300">
                        {initials}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold tracking-[0.06em] text-zinc-900 uppercase dark:text-white">
                          {finalEvaluator && allSubmitted
                            ? "0x7C...92F"
                            : name}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-500 uppercase">
                          {finalEvaluator && allSubmitted
                            ? "Identity redacted"
                            : role}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-2 text-[10px] font-bold tracking-[0.08em] uppercase",
                        sealed ? "text-emerald-500" : "text-zinc-400",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5",
                          sealed
                            ? "bg-emerald-400"
                            : "bg-zinc-400 animate-pulse",
                        )}
                      />
                      {sealed ? "Sealed" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              className="button-primary mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-zinc-950 px-4 py-3 text-center text-[11px] leading-4 font-bold tracking-[0.12em] uppercase transition-colors hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-70 dark:bg-white dark:hover:bg-zinc-200"
              disabled={phase === "computing"}
              onClick={runDemo}
              type="button"
            >
              {phase === "computing" ? (
                <>
                  <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border border-black/25 border-t-black" />
                  Running confidential computation
                </>
              ) : isRevealed ? (
                "Reset evaluation"
              ) : (
                <>
                  Submit final evaluation
                  <Icon name="chevron-right" size={14} />
                </>
              )}
            </button>
          </div>

          <div className="flex min-w-0 flex-col p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.13em] text-zinc-500 uppercase">
                Confidential result board
              </p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase">
                <Icon name="lock" size={11} />
                Scores encrypted
              </div>
            </div>

            <div className="mt-6 grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] md:grid-cols-3 dark:border-white/[0.06] dark:bg-white/[0.06]">
              {submissions.map(([name, description], index) => {
                const selected = isRevealed && index === 0;

                return (
                  <article
                    className={cn(
                      "relative flex min-h-52 flex-col bg-[#EBE8E1] p-5 transition-colors dark:bg-[#111]",
                      selected &&
                        "bg-emerald-500/[0.06] dark:bg-emerald-500/[0.06]",
                    )}
                    key={name}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">
                        SUBMISSION / 0{index + 1}
                      </span>
                      <AnimatePresence initial={false} mode="wait">
                        {selected ? (
                          <motion.span
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold tracking-[0.1em] text-emerald-500 uppercase"
                            exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                            initial={{
                              opacity: reduceMotion ? 1 : 0,
                              y: reduceMotion ? 0 : 4,
                            }}
                            key="recommended"
                          >
                            Recommended
                          </motion.span>
                        ) : (
                          <motion.span
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            initial={{ opacity: reduceMotion ? 1 : 0 }}
                            key="locked"
                          >
                            <Icon
                              className="text-zinc-400"
                              name="lock"
                              size={13}
                            />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <h3 className="mt-7 text-sm font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
                      {name}
                    </h3>
                    <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                      {description}
                    </p>
                    <div className="mt-auto border-t border-black/[0.06] pt-4 dark:border-white/[0.06]">
                      <p className="text-[10px] text-zinc-500 uppercase">
                        Aggregate score
                      </p>
                      <motion.p
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "mt-2 text-xl font-bold",
                          selected
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400",
                        )}
                        initial={{
                          opacity: reduceMotion ? 1 : 0,
                          y: reduceMotion ? 0 : 4,
                        }}
                        key={`${name}-${phase}`}
                        transition={{ duration: reduceMotion ? 0 : 0.3 }}
                      >
                        {isRevealed
                          ? index === 0
                            ? "92.4"
                            : index === 1
                              ? "88.1"
                              : "84.7"
                          : "LOCKED"}
                      </motion.p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="relative mt-5 overflow-hidden border border-black/[0.06] bg-black/[0.015] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase">
                  Encrypted packet route
                </p>
                <span className="text-[10px] text-zinc-500 uppercase">
                  {phase === "collecting"
                    ? "Awaiting final input"
                    : phase === "computing"
                      ? "Protected execution"
                      : "Receipt confirmed"}
                </span>
              </div>
              <div className="relative mt-6 grid grid-cols-4">
                <div className="absolute top-3 right-4 left-4 h-px bg-black/10 dark:bg-white/10" />
                <motion.div
                  animate={{
                    scaleX:
                      phase === "collecting"
                        ? 0
                        : phase === "computing"
                          ? 0.5
                          : 1,
                  }}
                  className="proof-flow absolute top-3 right-4 left-4 h-px origin-left bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500"
                  transition={{
                    duration: reduceMotion ? 0 : 0.7,
                    ease: "easeOut",
                  }}
                />
                {["EVAL-04", "ENCRYPT", "NOX", "RESULT"].map(
                  (label, index) => {
                    const active =
                      phase === "collecting"
                        ? index === 0
                        : phase === "computing"
                          ? index <= 2
                          : true;

                    return (
                      <div
                        className="relative z-10 flex flex-col items-center"
                        key={label}
                      >
                        <span
                          className={cn(
                            "h-6 w-6 border bg-[#EBE8E1] transition-colors dark:bg-[#111]",
                            active
                              ? "border-emerald-500/40"
                              : "border-black/10 dark:border-white/10",
                          )}
                        />
                        <span className="mt-3 text-[9px] text-zinc-500">
                          {label}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 overflow-x-auto border-t border-black/[0.06] px-5 py-3 dark:border-white/[0.06]">
          <span className="shrink-0 text-[10px] tracking-[0.12em] text-zinc-500 uppercase">
            Verification rail
          </span>
          {receiptBlocks.map((receipt, index) => (
            <div
              className={cn(
                "flex h-7 min-w-16 items-center justify-center border text-[10px] font-bold transition-colors",
                (phase === "computing" && index < 2) || isRevealed
                  ? "border-indigo-500/35 bg-indigo-500/10 text-indigo-500"
                  : "border-black/[0.08] bg-black/[0.02] text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.02]",
              )}
              key={receipt}
            >
              {receipt}
            </div>
          ))}
          <div className="proof-flow h-px min-w-20 flex-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          <span className="shrink-0 text-[10px] text-zinc-500">
            CONFIRMATIONS / {isRevealed ? "06" : "00"}
          </span>
        </div>
      </div>
    </section>
  );
}
