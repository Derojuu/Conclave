import { Check, LockKeyhole, ShieldCheck } from "lucide-react";

import { AnimatedConclaveMark } from "@/components/ui/animated-conclave-mark";
import { LiveIndicator } from "@/components/ui/live-indicator";

const evaluators = [
  ["01", "Domain review"],
  ["02", "Feasibility"],
  ["03", "Impact"],
  ["04", "Risk"],
] as const;

const stages = ["INPUTS", "SEAL", "COMPUTE", "RECEIPT", "RESULT"] as const;

export function ConclaveConsole() {
  return (
    <div className="relative overflow-hidden rounded-sm border border-black/[0.07] bg-[#EBE8E1] shadow-[0_30px_80px_rgba(0,0,0,0.16)] dark:border-white/[0.08] dark:bg-[#111]">
      <div className="console-scanline pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-transparent via-indigo-500/[0.04] to-transparent" />

      <div className="relative z-10 flex h-12 items-center justify-between border-b border-black/[0.06] px-4 sm:px-5 dark:border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-zinc-500/50" />
          <span className="h-2 w-2 rounded-full bg-zinc-500/30" />
          <span className="h-2 w-2 rounded-full bg-zinc-500/15" />
        </div>
        <p className="truncate px-3 text-[9px] font-bold tracking-[0.14em] text-zinc-500 uppercase sm:text-[10px]">
          Research grant selection / Final review
        </p>
        <LiveIndicator
          className="hidden sm:flex"
          label="Nox protected"
          tone="emerald"
        />
        <span className="h-1.5 w-1.5 bg-emerald-500 sm:hidden" />
      </div>

      <div className="relative z-10 grid grid-cols-[0.76fr_1.24fr]">
        <section className="border-r border-black/[0.06] p-3 sm:p-5 dark:border-white/[0.07]">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[8px] tracking-[0.12em] text-zinc-500 uppercase sm:text-[9px]">
                Evaluator activity
              </p>
              <p className="mt-2 text-xl font-bold text-zinc-950 sm:text-2xl dark:text-white">
                4 / 4
              </p>
            </div>
            <LockKeyhole
              aria-hidden="true"
              className="mb-1 text-indigo-500"
              size={14}
            />
          </div>

          <div className="mt-4 divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.06] dark:border-white/[0.06]">
            {evaluators.map(([number, role]) => (
              <div
                className="flex h-11 items-center justify-between gap-2"
                key={number}
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-black/[0.08] text-[8px] font-bold text-zinc-500 dark:border-white/[0.08]">
                    {number}
                  </span>
                  <div className="min-w-0">
                    <p className="hidden truncate text-[9px] font-bold tracking-[0.06em] text-zinc-800 uppercase sm:block dark:text-zinc-200">
                      {role}
                    </p>
                    <p className="text-[7px] text-zinc-500 uppercase sm:mt-1 sm:text-[8px]">
                      Input private
                    </p>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[7px] font-bold text-emerald-500 uppercase sm:text-[8px]">
                  <span className="h-1 w-1 bg-emerald-500" />
                  <span className="hidden sm:inline">Sealed</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="relative min-w-0 p-3 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[8px] tracking-[0.12em] text-zinc-500 uppercase sm:text-[9px]">
                Confidential execution
              </p>
              <p className="mt-1 hidden text-[10px] font-bold text-zinc-900 uppercase sm:block dark:text-white">
                Approved policy / Weighted aggregate
              </p>
            </div>
            <span className="border border-indigo-500/20 bg-indigo-500/[0.05] px-2 py-1 text-[7px] font-bold tracking-[0.08em] text-indigo-500 uppercase sm:text-[8px]">
              Protected
            </span>
          </div>

          <div className="relative mt-4 grid min-h-40 grid-cols-[1fr_auto_1fr] items-center gap-2 border-y border-black/[0.06] py-5 sm:min-h-44 sm:gap-5 dark:border-white/[0.06]">
            <div className="relative z-10 min-w-0">
              <p className="text-[7px] font-bold tracking-[0.1em] text-zinc-500 uppercase sm:text-[8px]">
                Encrypted bundle
              </p>
              <div className="mt-3 space-y-2">
                {[76, 58, 68].map((width, index) => (
                  <div
                    className="flex items-center gap-1.5"
                    key={`${width}-${index}`}
                  >
                    <span className="h-1 w-1 shrink-0 bg-indigo-500" />
                    <span
                      className="h-px bg-zinc-300 dark:bg-zinc-700"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 hidden font-mono text-[7px] text-zinc-500 sm:block">
                0x8f...c21
              </p>
            </div>

            <div className="relative z-10">
              <AnimatedConclaveMark className="h-14 w-14 sm:h-20 sm:w-20" />
            </div>

            <div className="relative z-10 min-w-0 text-right">
              <p className="text-[7px] font-bold tracking-[0.1em] text-emerald-500 uppercase sm:text-[8px]">
                Verified result
              </p>
              <p className="mt-3 truncate text-[10px] font-bold text-zinc-950 uppercase sm:text-sm dark:text-white">
                Northstar
              </p>
              <p className="mt-1 hidden text-[8px] text-zinc-500 uppercase sm:block">
                Recommended
              </p>
              <div className="mt-3 inline-flex h-6 w-6 items-center justify-center border border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-500">
                <Check aria-hidden="true" size={12} />
              </div>
            </div>

            <div className="absolute top-1/2 right-[14%] left-[14%] h-px bg-black/10 dark:bg-white/10" />
            <div className="proof-flow absolute top-1/2 right-[14%] left-[14%] h-px bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500" />
            <span className="conclave-route-packet absolute top-[calc(50%_-_3px)] left-[14%] z-20 h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
          </div>

          <div className="mt-4 grid grid-cols-5">
            {stages.map((stage, index) => (
              <div className="flex min-w-0 flex-col items-center" key={stage}>
                <span
                  className={
                    index === stages.length - 1
                      ? "flex h-5 w-5 items-center justify-center border border-emerald-500/35 text-emerald-500"
                      : "flex h-5 w-5 items-center justify-center border border-indigo-500/25 text-indigo-500"
                  }
                >
                  {index === stages.length - 1 ? (
                    <ShieldCheck aria-hidden="true" size={10} />
                  ) : (
                    <span className="text-[7px]">{index + 1}</span>
                  )}
                </span>
                <span className="mt-2 hidden text-[7px] text-zinc-500 sm:block">
                  {stage}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="relative z-10 flex h-9 items-center justify-between gap-4 border-t border-black/[0.06] px-4 sm:px-5 dark:border-white/[0.07]">
        <span className="truncate font-mono text-[7px] text-zinc-500 sm:text-[8px]">
          RECEIPT / 0x19a...7e2
        </span>
        <span className="shrink-0 text-[7px] font-bold tracking-[0.08em] text-emerald-500 uppercase sm:text-[8px]">
          06 confirmations
        </span>
      </div>
    </div>
  );
}
