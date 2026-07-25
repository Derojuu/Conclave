import { siteLinks } from "@/lib/site-links";

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-zinc-200 px-6 py-12 dark:border-white/[0.06]">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 md:flex-row">
        <div className="text-[11px] font-medium tracking-[0.1em] text-zinc-500 uppercase">
          Conclave - Confidential inputs. Verified outcomes.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <a
            className="text-[11px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.product}
          >
            PRODUCT
          </a>
          <a
            className="text-[11px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.documentation}
            rel="noreferrer"
            target="_blank"
          >
            IEXEC DOCS
          </a>
          <a
            className="text-[11px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.faq}
          >
            FAQ
          </a>
          <a
            className="text-[11px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.privacy}
          >
            PRIVACY
          </a>
          <a
            className="text-[11px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.terms}
          >
            TERMS
          </a>
        </div>
      </div>
    </footer>
  );
}
