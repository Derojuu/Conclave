import { Icon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { decisionProblems } from "@/constants/site";

export function ProblemSection() {
  return (
    <section className="border-y border-black/[0.06] py-20 dark:border-white/[0.06]">
      <SectionHeading
        description="Most decision tools optimize for collecting information. They do not protect the independence of the people providing it."
        eyebrow="The problem"
        title="Visibility changes the decision."
      />

      <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-black/[0.06] bg-black/[0.06] md:grid-cols-2 xl:grid-cols-4 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {decisionProblems.map((problem, index) => (
          <article
            className="group flex min-h-64 flex-col bg-[#EBE8E1] p-6 transition-colors hover:bg-[#e5e1d8] dark:bg-[#111] dark:hover:bg-[#151515]"
            key={problem.title}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-black/[0.08] text-zinc-500 dark:border-white/[0.08]">
                <Icon name={problem.icon} size={17} />
              </div>
              <span className="text-[8px] tracking-[0.14em] text-zinc-400">
                0{index + 1}
              </span>
            </div>
            <h3 className="mt-8 text-sm font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
              {problem.title}
            </h3>
            <p className="mt-4 text-[11px] leading-5 text-zinc-500">
              {problem.description}
            </p>
            <div className="mt-auto flex items-center gap-2 border-t border-black/[0.06] pt-5 dark:border-white/[0.06]">
              <span className="h-1.5 w-1.5 bg-rose-500" />
              <p className="text-[8px] font-bold tracking-[0.14em] text-rose-500 uppercase">
                {problem.signal}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
