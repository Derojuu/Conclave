import { BrandMark } from "@/components/ui/brand-mark";
import { siteLinks } from "@/lib/site-links";

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-zinc-200 px-6 py-12 dark:border-white/[0.06]">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
          <a
            className="group flex items-center gap-3"
            href={siteLinks.home}
          >
            <BrandMark className="transition-transform group-hover:scale-95" />
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              Conclave
            </span>
          </a>
          <p className="text-[11px] font-medium tracking-[0.1em] text-zinc-500 uppercase">
            Confidential inputs. Verified outcomes.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <a
            className="text-[13px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.product}
          >
            PRODUCT
          </a>
          <a
            className="text-[13px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.documentation}
            rel="noreferrer"
            target="_blank"
          >
            IEXEC DOCS
          </a>
          <a
            className="text-[13px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.faq}
          >
            FAQ
          </a>
          <a
            className="text-[13px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.privacy}
          >
            PRIVACY
          </a>
          <a
            className="text-[13px] font-medium tracking-[0.15em] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
            href={siteLinks.terms}
          >
            TERMS
          </a>
        </div>
      </div>
    </footer>
  );
}
