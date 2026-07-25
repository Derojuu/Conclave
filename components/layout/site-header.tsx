import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { BrandMark } from "@/components/ui/brand-mark";
import { Icon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { navigationItems } from "@/constants/site";
import { siteLinks } from "@/lib/site-links";

export function SiteHeader() {
  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-[#F5F2EB]/80 backdrop-blur-md transition-colors duration-300 dark:border-white/[0.06] dark:bg-[#0a0a0a]/80">
        <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <a className="group flex items-center gap-3" href={siteLinks.home}>
              <BrandMark className="transition-transform group-hover:scale-95" />
              <span className="select-none text-lg font-bold">Conclave</span>
            </a>
            <div className="hidden items-center gap-1 md:flex">
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
            <a
              className="button-wallet hidden h-[41px] items-center justify-center rounded-[2px] bg-[#0988F0] px-4 text-sm font-normal transition-[border-radius,background-color,transform] duration-200 hover:rounded-[3px] hover:bg-[#1595fb] active:scale-[0.975] sm:inline-flex"
              href={siteLinks.demo}
            >
              Launch Demo
            </a>
            <details className="relative md:hidden">
              <summary className="flex h-9 w-9 list-none items-center justify-center rounded-sm border border-zinc-200 text-zinc-500 dark:border-white/[0.08]">
                <Icon name="menu" size={16} />
              </summary>
              <div className="absolute top-12 right-0 w-56 rounded-sm border border-black/[0.08] bg-[#F5F2EB] p-2 shadow-2xl dark:border-white/[0.08] dark:bg-[#111]">
                {navigationItems.map((item) => (
                  <a
                    className="block rounded-sm px-3 py-3 text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    href={item.href}
                    key={item.label}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </details>
          </div>
        </nav>
      </header>
    </>
  );
}
