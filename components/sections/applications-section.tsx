import { Icon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { applications } from "@/constants/site";

export function ApplicationsSection() {
  return (
    <section
      className="border-y border-black/[0.06] py-20 dark:border-white/[0.06]"
      id="applications"
    >
      <SectionHeading
        align="center"
        description="Any workflow that combines sensitive human judgment can use Conclave as its confidential decision layer."
        eyebrow="Real-world applications"
        title="One infrastructure. Many high-stakes decisions."
      />

      <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 lg:grid-cols-4 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {applications.map((application, index) => (
          <article
            className="group flex min-h-60 flex-col bg-[#EBE8E1] p-5 transition-colors hover:bg-[#e5e1d8] dark:bg-[#111] dark:hover:bg-[#151515]"
            key={application.title}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-black/[0.08] text-zinc-500 transition-colors group-hover:text-indigo-500 dark:border-white/[0.08]">
                <Icon name={application.icon} size={17} />
              </div>
              <span className="text-[10px] tracking-[0.12em] text-zinc-400">
                CASE / {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-8 text-[13px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
              {application.title}
            </h3>
            <p className="mt-3 text-[12px] leading-5 text-zinc-500">
              {application.description}
            </p>
            <div className="mt-auto flex items-center gap-2 border-t border-black/[0.06] pt-5 text-[10px] font-bold tracking-[0.1em] text-emerald-600 uppercase dark:border-white/[0.06] dark:text-emerald-400">
              <Icon name="lock" size={11} />
              Confidential input layer
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
