import Link from "next/link";

import { BrandMark } from "@/components/ui/brand-mark";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F2EB] px-5 py-12 dark:bg-[#0a0a0a]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-sm border border-black/[0.07] bg-[#EBE8E1] shadow-[0_35px_90px_rgba(0,0,0,0.18)] dark:border-white/[0.07] dark:bg-[#111]">
        <header className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5 dark:border-white/[0.06]">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <span className="text-sm font-bold">Conclave</span>
          </Link>
          <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-500 uppercase">
            Secure access
          </span>
        </header>
        {children}
      </section>
    </main>
  );
}
