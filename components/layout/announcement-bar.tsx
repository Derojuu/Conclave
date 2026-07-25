export function AnnouncementBar() {
  return (
    <div className="flex w-full items-center justify-between border-b border-black/[0.06] bg-[#EBE8E1] px-6 py-1.5 dark:border-white/[0.04] dark:bg-[#111]">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-[10px] font-medium tracking-[0.15em] text-zinc-500 uppercase">
          Confidential Decision Infrastructure
        </span>
      </div>
      <div className="text-[10px] font-medium tracking-[0.05em] text-indigo-500 uppercase dark:text-indigo-400/80">
        iExec Nox Confidential Runtime
      </div>
    </div>
  );
}
