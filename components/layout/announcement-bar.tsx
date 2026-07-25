export function AnnouncementBar() {
  return (
    <div className="w-full border-b border-black/[0.06] bg-[#EBE8E1] px-4 py-2 dark:border-white/[0.04] dark:bg-[#111] sm:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center sm:justify-between sm:text-left">
        <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-start">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-indigo-500" />
          <span className="text-[10px] leading-4 font-medium tracking-[0.08em] text-zinc-500 uppercase min-[380px]:text-[11px] sm:text-[12px] sm:tracking-[0.15em]">
            Confidential Decision Infrastructure
          </span>
        </div>
        <div className="text-[10px] leading-4 font-medium tracking-[0.04em] text-indigo-500 uppercase min-[380px]:text-[11px] sm:text-[12px] sm:tracking-[0.05em] dark:text-indigo-400/80">
          iExec Nox Confidential Runtime
        </div>
      </div>
    </div>
  );
}
