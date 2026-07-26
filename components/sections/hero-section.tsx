import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { ConclaveConsole } from "@/components/sections/conclave-console";
import { AnimatedConclaveMark } from "@/components/ui/animated-conclave-mark";
import { siteLinks } from "@/lib/site-links";

export function HeroSection() {
  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-black/[0.06] pt-12 pb-14 sm:pt-16 dark:border-white/[0.06]"
      id="top"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800c_1px,transparent_1px),linear-gradient(to_bottom,#8080800c_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,#000_0%,transparent_92%)]" />

      <div className="relative mx-auto w-full max-w-[1400px] px-6">
        <div className="grid items-start gap-7 lg:grid-cols-[144px_1fr] lg:gap-10">
          <AnimatedConclaveMark className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28" />

          <div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 bg-emerald-500" />
              <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
                Conclave / Confidential decision infrastructure
              </p>
            </div>

            <h1 className="mt-5 max-w-[980px] text-4xl leading-[0.96] font-bold text-zinc-950 uppercase sm:text-5xl lg:text-6xl dark:text-white">
              Private inputs. Verified outcomes.
            </h1>

            <div className="mt-6 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <p className="max-w-2xl text-[13px] leading-6 text-zinc-600 sm:text-sm dark:text-zinc-400">
                Run high-stakes evaluations without exposing individual scores,
                comments, rankings, or recommendations. Conclave protects every
                judgment and reveals only the approved decision.
              </p>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-zinc-950 px-6 text-[11px] font-bold tracking-[0.12em] uppercase transition-[background-color,transform] hover:bg-zinc-800 active:scale-[0.985] dark:bg-white dark:hover:bg-zinc-200"
                  href={siteLinks.signup}
                >
                  Create account
                  <ArrowRight aria-hidden="true" size={14} />
                </Link>
                <a
                  className="button-secondary inline-flex min-h-12 items-center justify-center rounded-sm border border-black/10 px-6 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors hover:border-indigo-500 hover:text-indigo-500 dark:border-white/10"
                  href={siteLinks.product}
                >
                  View workflow
                </a>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 border-t border-black/[0.06] pt-5 dark:border-white/[0.06]">
              <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.08em] text-zinc-500 uppercase">
                <LockKeyhole aria-hidden="true" size={13} />
                Encrypted evaluations
              </span>
              <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.08em] text-zinc-500 uppercase">
                <ShieldCheck aria-hidden="true" size={13} />
                Confidential computation
              </span>
              <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.08em] text-zinc-500 uppercase">
                <span className="h-1.5 w-1.5 bg-emerald-500" />
                Result-only disclosure
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <ConclaveConsole />
        </div>
      </div>
    </section>
  );
}
