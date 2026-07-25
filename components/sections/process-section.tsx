import { Icon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { processSteps } from "@/constants/site";

export function ProcessSection() {
  return (
    <section
      className="border-y border-black/[0.06] py-20 dark:border-white/[0.06]"
      id="how-it-works"
    >
      <SectionHeading
        align="center"
        description="Organizations keep their familiar evaluation workflow. Conclave changes what the system is allowed to see."
        eyebrow="How Conclave works"
        title="From independent evaluation to trusted result."
      />

      <div className="relative mt-14 grid gap-px overflow-hidden rounded-sm border border-black/[0.06] bg-black/[0.06] lg:grid-cols-5 dark:border-white/[0.06] dark:bg-white/[0.06]">
        <div className="proof-flow absolute top-[45px] right-[10%] left-[10%] z-20 hidden h-px bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 lg:block" />
        {processSteps.map((step) => (
          <article
            className="relative z-10 flex min-h-64 flex-col bg-[#EBE8E1] p-5 dark:bg-[#111]"
            key={step.number}
          >
            <div className="flex items-center justify-between">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-sm border border-black/[0.08] bg-[#EBE8E1] text-zinc-500 dark:border-white/[0.09] dark:bg-[#111]">
                <Icon name={step.icon} size={18} />
              </div>
              <span className="text-[8px] tracking-[0.12em] text-zinc-400">
                {step.number}
              </span>
            </div>
            <h3 className="mt-8 text-[11px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
              {step.title}
            </h3>
            <p className="mt-3 text-[10px] leading-5 text-zinc-500">
              {step.description}
            </p>
            <div
              className={
                step.visibility === "Private"
                  ? "mt-auto flex items-center gap-2 pt-6 text-[8px] font-bold tracking-[0.12em] text-indigo-500 uppercase"
                  : "mt-auto flex items-center gap-2 pt-6 text-[8px] font-bold tracking-[0.12em] text-emerald-600 uppercase dark:text-emerald-400"
              }
            >
              <span className="h-1.5 w-1.5 bg-current" />
              {step.visibility}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
