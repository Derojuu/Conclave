import { Icon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";

const architectureNodes = [
  ["Campaign", "Authorized evaluators", "users"],
  ["Encrypted evaluation", "Scores and comments", "lock"],
  ["iExec Nox", "Protected runtime", "cpu"],
  ["Confidential compute", "Weights and policy", "sliders"],
  ["Ethereum receipt", "Verification record", "globe"],
  ["Verified result", "Approved outcome", "check"],
] as const;

export function ArchitectureSection() {
  return (
    <section className="py-20">
      <div className="grid items-center gap-14 lg:grid-cols-[0.7fr_1.3fr]">
        <SectionHeading
          description="Conclave separates private decision inputs from the result organizations are authorized to publish."
          eyebrow="Architecture preview"
          title="Simple on the surface. Confidential underneath."
        />

        <div className="overflow-hidden rounded-sm border border-black/[0.06] bg-[#EBE8E1] dark:border-white/[0.06] dark:bg-[#111]">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.06]">
            <div>
              <p className="text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
                Decision execution path
              </p>
              <p className="mt-1 text-[10px] tracking-[0.1em] text-zinc-500 uppercase">
                Public and confidential boundaries
              </p>
            </div>
            <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-emerald-500 uppercase">
              <span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />
              Verified route
            </span>
          </div>

          <div className="relative p-5 sm:p-7">
            <div className="proof-flow absolute top-[55px] right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 md:block" />
            <div className="relative grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] md:grid-cols-3 dark:border-white/[0.06] dark:bg-white/[0.06]">
              {architectureNodes.map(([title, detail, icon], index) => (
                <article
                  className="relative z-10 min-h-40 bg-[#EBE8E1] p-4 dark:bg-[#111]"
                  key={title}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-black/[0.08] bg-[#EBE8E1] dark:border-white/[0.08] dark:bg-[#111]">
                      <Icon
                        className={
                          index === 2 || index === 3
                            ? "text-indigo-500"
                            : index >= 4
                              ? "text-emerald-500"
                              : "text-zinc-500"
                        }
                        name={
                          icon as
                            | "users"
                            | "lock"
                            | "cpu"
                            | "sliders"
                            | "globe"
                            | "check"
                        }
                        size={16}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      HOP / 0{index + 1}
                    </span>
                  </div>
                  <p className="mt-7 text-[12px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
                    {title}
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                    {detail}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] sm:grid-cols-3 dark:border-white/[0.06] dark:bg-white/[0.06]">
              <div className="bg-[#EBE8E1] px-4 py-3 dark:bg-[#111]">
                <p className="text-[9px] tracking-[0.12em] text-zinc-500 uppercase">
                  Public
                </p>
                <p className="mt-2 text-[11px] font-bold text-zinc-900 uppercase dark:text-white">
                  Campaign policy
                </p>
              </div>
              <div className="bg-indigo-500/[0.05] px-4 py-3">
                <p className="text-[9px] tracking-[0.12em] text-indigo-500 uppercase">
                  Confidential boundary
                </p>
                <p className="mt-2 text-[11px] font-bold text-zinc-900 uppercase dark:text-white">
                  Inputs + computation
                </p>
              </div>
              <div className="bg-emerald-500/[0.05] px-4 py-3">
                <p className="text-[9px] tracking-[0.12em] text-emerald-500 uppercase">
                  Published
                </p>
                <p className="mt-2 text-[11px] font-bold text-zinc-900 uppercase dark:text-white">
                  Receipt + result
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
              <Icon className="text-emerald-500" name="shield" size={16} />
              <span className="text-[11px] leading-5 text-zinc-500">
                Sensitive evaluations never enter the public result layer.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
