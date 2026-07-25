import { Icon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";

const visibleScores = [
  ["Evaluator 01", "91"],
  ["Evaluator 02", "74"],
  ["Evaluator 03", "88"],
] as const;

export function ConfidentialitySection() {
  return (
    <section className="grid items-center gap-14 py-20 lg:grid-cols-[0.72fr_1.28fr]">
      <SectionHeading
        description="When people know their score, comment, or position can be inspected, they adapt it. Confidentiality preserves independent judgment before consensus is calculated."
        eyebrow="Why confidentiality matters"
        title="Fair outcomes begin with private inputs."
      />

      <div className="grid gap-px overflow-hidden rounded-sm border border-black/[0.06] bg-black/[0.06] md:grid-cols-2 dark:border-white/[0.06] dark:bg-white/[0.06]">
        <article className="overflow-hidden bg-[#EBE8E1] dark:bg-[#111]">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.06]">
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
                Observable review / legacy
              </p>
              <p className="mt-1 text-[8px] tracking-[0.1em] text-zinc-500 uppercase">
                Administrator-readable inputs
              </p>
            </div>
            <Icon className="text-rose-400" name="eye" size={18} />
          </div>
          <div className="p-5">
            <p className="text-[8px] tracking-[0.12em] text-zinc-500 uppercase">
              Evaluation stream / exposed
            </p>
            <div className="mt-5 space-y-2">
              {visibleScores.map(([evaluator, score]) => (
                <div
                  className="flex items-center justify-between border border-black/[0.06] bg-black/[0.015] p-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
                  key={evaluator}
                >
                  <span className="text-[9px] tracking-[0.08em] text-zinc-600 uppercase dark:text-zinc-300">
                    {evaluator}
                  </span>
                  <span className="flex items-center gap-3 text-[9px] font-bold text-zinc-900 dark:text-white">
                    SCORE / {score}
                    <span className="h-1.5 w-1.5 bg-rose-500" />
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-black/[0.06] pt-5 dark:border-white/[0.06]">
              <p className="text-[9px] font-bold tracking-[0.08em] text-rose-500 uppercase">
                Risk / later reviewers anchor on earlier opinions
              </p>
            </div>
          </div>
        </article>

        <article className="overflow-hidden bg-[#EBE8E1] dark:bg-[#111]">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.06]">
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
                Confidential review / Conclave
              </p>
              <p className="mt-1 text-[8px] tracking-[0.1em] text-zinc-500 uppercase">
                Inputs protected during computation
              </p>
            </div>
            <Icon className="text-emerald-500" name="shield" size={18} />
          </div>
          <div className="p-5">
            <p className="text-[8px] tracking-[0.12em] text-zinc-500 uppercase">
              Evaluation stream / sealed
            </p>
            <div className="mt-5 space-y-2">
              {visibleScores.map(([, score], index) => (
                <div
                  className="flex items-center justify-between border border-black/[0.06] bg-black/[0.015] p-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
                  key={score}
                >
                  <span className="privacy-redact text-[9px] tracking-[0.08em] text-zinc-600 uppercase dark:text-zinc-300">
                    EVALUATOR / 0x{index + 4}A...{index + 7}F
                  </span>
                  <span className="flex items-center gap-2 text-[8px] font-bold tracking-[0.1em] text-emerald-500 uppercase">
                    <Icon name="lock" size={11} />
                    Sealed
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-black/[0.06] pt-5 dark:border-white/[0.06]">
              <p className="text-[9px] font-bold tracking-[0.08em] text-emerald-600 uppercase dark:text-emerald-400">
                State / independent judgment preserved
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
