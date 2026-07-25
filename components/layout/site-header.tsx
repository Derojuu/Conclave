import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { BrandMark } from "@/components/ui/brand-mark";
import { Icon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { navigationItems } from "@/constants/site";
import { siteLinks } from "@/lib/site-links";
import { LogIn } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-[#F5F2EB]/80 backdrop-blur-md transition-colors duration-300 dark:border-white/[0.06] dark:bg-[#0a0a0a]/80">
        <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link className="group flex items-center gap-3" href={siteLinks.home}>
              <BrandMark className="transition-transform group-hover:scale-95" />
              <span className="select-none text-lg font-bold">Conclave</span>
            </Link>
            <div className="hidden items-center gap-1 xl:flex">
              {navigationItems.map((item) => (
                <a
                  className="nav-pill text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              aria-label="Sign in"
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-black/[0.08] text-zinc-600 transition-colors hover:bg-black/[0.04] hover:text-zinc-950 sm:hidden dark:border-white/[0.08] dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
              href={siteLinks.login}
              title="Sign in"
            >
              <LogIn aria-hidden="true" size={16} />
            </Link>
            <Link
              className="hidden h-10 items-center justify-center px-3 text-[12px] font-bold tracking-[0.1em] text-zinc-600 uppercase transition-colors hover:text-zinc-950 sm:inline-flex dark:text-zinc-400 dark:hover:text-white"
              href={siteLinks.login}
            >
              Sign in
            </Link>
            <Link
              className="button-wallet hidden h-10 items-center justify-center rounded-[2px] bg-[#0988F0] px-4 text-[12px] font-bold tracking-[0.08em] uppercase transition-[border-radius,background-color,transform] duration-200 hover:rounded-[3px] hover:bg-[#1595fb] active:scale-[0.975] md:inline-flex"
              href={siteLinks.signup}
            >
              Create account
            </Link>
            <details className="relative xl:hidden">
              <summary
                aria-label="Open navigation"
                className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-sm border border-zinc-200 text-zinc-500 transition-colors hover:bg-black/[0.04] dark:border-white/[0.08] dark:hover:bg-white/[0.05]"
                title="Navigation"
              >
                <Icon name="menu" size={16} />
              </summary>
              <div className="absolute top-12 right-0 w-[min(18rem,calc(100vw-2rem))] rounded-sm border border-black/[0.08] bg-[#F5F2EB] p-2 shadow-2xl dark:border-white/[0.08] dark:bg-[#111]">
                {navigationItems.map((item) => (
                  <a
                    className="block rounded-sm px-3 py-3 text-[12px] font-bold tracking-[0.12em] text-zinc-500 uppercase hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    href={item.href}
                    key={item.label}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="my-2 border-t border-black/[0.07] dark:border-white/[0.07]" />
                <Link
                  className="block rounded-sm px-3 py-3 text-[12px] font-bold tracking-[0.12em] text-zinc-600 uppercase hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.04]"
                  href={siteLinks.login}
                >
                  Sign in
                </Link>
                <Link
                  className="mt-1 flex min-h-10 items-center justify-center rounded-[2px] bg-[#0988F0] px-3 text-[12px] font-bold tracking-[0.1em] text-black uppercase transition-colors hover:bg-[#1595fb]"
                  href={siteLinks.signup}
                >
                  Create account
                </Link>
              </div>
            </details>
          </div>
        </nav>
      </header>
    </>
  );
}
