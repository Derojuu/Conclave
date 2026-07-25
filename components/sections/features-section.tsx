import { Icon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { productFeatures } from "@/constants/site";

export function FeaturesSection() {
  return (
    <section className="py-20" id="why-conclave">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          description="Conclave combines the controls organizations expect with a confidentiality model ordinary workflow software cannot provide."
          eyebrow="Why Conclave"
          title="Decision infrastructure, not another form builder."
        />
        <div className="flex items-center gap-4 rounded-sm border border-black/[0.06] bg-[#EBE8E1] px-5 py-4 dark:border-white/[0.06] dark:bg-[#111]">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-emerald-500/20 text-emerald-500">
            <Icon name="shield" size={16} />
          </div>
          <div>
            <p className="text-[8px] tracking-[0.12em] text-zinc-500 uppercase">
              System policy
            </p>
            <p className="mt-1 text-[10px] font-bold tracking-[0.08em] text-zinc-900 uppercase dark:text-white">
              Reveal outcomes, not opinions
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 lg:grid-cols-3 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {productFeatures.map((feature, index) => (
          <article
            className="group min-h-52 bg-[#EBE8E1] p-6 transition-colors hover:bg-[#e5e1d8] dark:bg-[#111] dark:hover:bg-[#151515]"
            key={feature.title}
          >
            <div className="flex items-center justify-between">
              <Icon
                className="text-zinc-500 transition-colors group-hover:text-indigo-500"
                name={feature.icon}
                size={18}
              />
              <span className="text-[8px] text-zinc-400">
                MODULE / {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-8 text-[11px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
              {feature.title}
            </h3>
            <p className="mt-3 max-w-sm text-[10px] leading-5 text-zinc-500">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
