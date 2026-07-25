import { BrandMark } from "@/components/ui/brand-mark";
import { Icon } from "@/components/ui/icons";
import { siteLinks } from "@/lib/site-links";

export function FinalCtaSection() {
  return (
    <section className="py-20">
      <div className="relative overflow-hidden rounded-sm border border-white/[0.07] bg-[#111] px-6 py-14 text-white sm:px-10 lg:px-14 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="console-scanline pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-indigo-500/[0.05] to-transparent" />

        <div className="relative z-10 grid items-end gap-12 lg:grid-cols-[1fr_auto]">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4">
              <BrandMark className="bg-white text-zinc-950 dark:bg-white dark:text-zinc-950" />
              <div>
                <p className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">
                  Conclave / decision infrastructure
                </p>
                <p className="mt-1 text-[10px] tracking-[0.12em] text-zinc-500 uppercase">
                  Powered by iExec Nox
                </p>
              </div>
            </div>
            <div className="mt-10 flex items-center gap-3">
              <span className="h-1.5 w-1.5 bg-emerald-400 animate-pulse" />
              <p className="text-[11px] font-bold tracking-[0.18em] text-emerald-400 uppercase">
                Build decisions people can trust
              </p>
            </div>
            <h2 className="mt-5 max-w-4xl text-3xl leading-[1.02] font-bold uppercase sm:text-5xl lg:text-6xl">
              Keep the judgment private. Make the outcome credible.
            </h2>
            <p className="mt-6 max-w-2xl text-xs leading-6 text-zinc-400 sm:text-sm">
              Run hiring, funding, procurement, admissions, and investment
              evaluations without exposing the people or judgments behind them.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              className="flex min-h-12 items-center justify-center gap-2 rounded-sm bg-white px-7 py-3 text-[11px] font-bold tracking-[0.13em] text-zinc-950 uppercase transition-colors hover:bg-zinc-200"
              href={siteLinks.demo}
            >
              Explore the demo
              <Icon name="chevron-right" size={14} />
            </a>
            <a
              className="flex min-h-12 items-center justify-center rounded-sm border border-white/15 px-7 py-3 text-[11px] font-bold tracking-[0.13em] text-zinc-300 uppercase transition-colors hover:bg-white/[0.05] hover:text-white"
              href={siteLinks.documentation}
              rel="noreferrer"
              target="_blank"
            >
              Read iExec docs
            </a>
          </div>
        </div>

        <div className="relative z-10 mt-12 grid gap-px overflow-hidden border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
          {[
            ["INPUTS", "CONFIDENTIAL"],
            ["COMPUTATION", "PROTECTED"],
            ["OUTPUT", "VERIFIABLE"],
          ].map(([label, value]) => (
            <div className="bg-[#111] px-4 py-3" key={label}>
              <p className="text-[9px] tracking-[0.12em] text-zinc-500">
                {label}
              </p>
              <p className="mt-2 text-[11px] font-bold tracking-[0.08em] text-white">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
