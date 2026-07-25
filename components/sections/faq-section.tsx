import { Icon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { faqItems } from "@/constants/site";

export function FaqSection() {
  return (
    <section
      className="border-y border-black/[0.06] py-20 dark:border-white/[0.06]"
      id="faq"
    >
      <div className="grid gap-14 lg:grid-cols-[0.65fr_1.35fr]">
        <SectionHeading
          description="The important questions are not only about encryption. They are about who can inspect sensitive judgment and when."
          eyebrow="Frequently asked questions"
          title="Trust requires clear boundaries."
        />

        <div className="overflow-hidden rounded-sm border border-black/[0.06] bg-[#EBE8E1] dark:border-white/[0.06] dark:bg-[#111]">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.06]">
            <p className="text-[11px] font-bold tracking-[0.12em] text-zinc-500 uppercase">
              Information registry
            </p>
            <span className="text-[10px] text-zinc-500">
              {String(faqItems.length).padStart(2, "0")} ENTRIES
            </span>
          </div>
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {faqItems.map((item, index) => (
              <details className="group px-5" key={item.question}>
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4">
                  <span className="flex items-center gap-4">
                    <span className="text-[10px] text-zinc-400">
                      0{index + 1}
                    </span>
                    <span className="text-[12px] font-bold tracking-[0.06em] text-zinc-950 uppercase dark:text-white">
                      {item.question}
                    </span>
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-black/[0.08] text-zinc-500 transition-transform group-open:rotate-90 dark:border-white/[0.08]">
                    <Icon name="chevron-right" size={12} />
                  </span>
                </summary>
                <p className="max-w-2xl border-t border-black/[0.05] py-5 text-[12px] leading-6 text-zinc-500 dark:border-white/[0.05]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
