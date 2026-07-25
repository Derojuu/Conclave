import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteLinks } from "@/lib/site-links";

export type LegalSection = {
  id: string;
  title: string;
};

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: LegalSection[];
  children: React.ReactNode;
};

export function LegalPageLayout({
  eyebrow,
  title,
  summary,
  lastUpdated,
  sections,
  children,
}: LegalPageLayoutProps) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <header className="border-b border-black/[0.07] px-6 py-20 dark:border-white/[0.07] sm:py-28">
          <div className="mx-auto max-w-[1100px]">
            <p className="text-[12px] font-bold tracking-[0.18em] text-indigo-600 uppercase dark:text-indigo-400">
              {eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl leading-[1.05] font-bold text-zinc-950 sm:text-6xl dark:text-white">
              {title}
            </h1>
            <p className="mt-7 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              {summary}
            </p>
            <p className="mt-8 text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase">
              Last updated {lastUpdated}
            </p>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-20 lg:py-24">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-5 text-[11px] font-bold tracking-[0.16em] text-zinc-400 uppercase">
              On this page
            </p>
            <nav aria-label={`${title} sections`}>
              <ol className="space-y-3">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      className="group flex gap-3 text-[12px] leading-5 text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
                      href={`#${section.id}`}
                    >
                      <span
                        aria-hidden="true"
                        className="text-zinc-300 group-hover:text-indigo-500 dark:text-zinc-700"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0 space-y-14 text-[13px] leading-7 text-zinc-600 dark:text-zinc-400">
            {children}
          </article>
        </div>

        <section className="border-t border-black/[0.07] px-6 py-14 dark:border-white/[0.07]">
          <div className="mx-auto flex max-w-[1100px] flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-zinc-400 uppercase">
                Conclave legal
              </p>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                Review the related policy or return to the product.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center border border-black/[0.09] px-4 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors hover:bg-black/[0.04] dark:border-white/[0.09] dark:hover:bg-white/[0.05]"
                href={siteLinks.privacy}
              >
                Privacy
              </Link>
              <Link
                className="inline-flex h-10 items-center border border-black/[0.09] px-4 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors hover:bg-black/[0.04] dark:border-white/[0.09] dark:hover:bg-white/[0.05]"
                href={siteLinks.terms}
              >
                Terms
              </Link>
              <Link
                className="inline-flex h-10 items-center bg-zinc-950 px-4 text-[11px] font-bold tracking-[0.12em] text-white uppercase transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                href={siteLinks.home}
              >
                Return home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
