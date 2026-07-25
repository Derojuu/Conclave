export default function ApplicationLoading() {
  return (
    <div aria-live="polite" className="max-w-5xl animate-pulse">
      <div className="h-2 w-40 bg-zinc-300 dark:bg-white/10" />
      <div className="mt-6 h-10 w-full max-w-xl bg-zinc-300 dark:bg-white/10" />
      <div className="mt-5 h-4 w-full max-w-2xl bg-zinc-200 dark:bg-white/[0.06]" />
      <div className="mt-10 grid gap-px overflow-hidden border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 xl:grid-cols-4 dark:border-white/[0.06] dark:bg-white/[0.06]">
        {[0, 1, 2, 3].map((item) => (
          <div
            className="h-40 bg-[#EBE8E1] dark:bg-[#111]"
            key={item}
          />
        ))}
      </div>
      <span className="sr-only">Loading Conclave workspace</span>
    </div>
  );
}
