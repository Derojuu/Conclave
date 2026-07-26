import Image from "next/image";

import { cn } from "@/utils/cn";

type AnimatedConclaveMarkProps = {
  className?: string;
};

export function AnimatedConclaveMark({ className }: AnimatedConclaveMarkProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-28 w-28 shrink-0 items-center justify-center",
        className,
      )}
    >
      <span className="conclave-mark-frame absolute inset-0 border border-black/10 dark:border-white/10" />
      <span className="absolute inset-3 border border-indigo-500/20" />
      <span className="absolute top-0 left-0 h-3 w-3 border-t border-l border-indigo-500" />
      <span className="absolute top-0 right-0 h-3 w-3 border-t border-r border-indigo-500" />
      <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-indigo-500" />
      <span className="absolute right-0 bottom-0 h-3 w-3 border-r border-b border-emerald-500" />

      <Image
        alt=""
        className="conclave-mark-breathe h-[68%] w-[68%] rounded-sm"
        height={96}
        priority
        src="/images/conclave-icon.svg"
        width={96}
      />

      <span className="conclave-mark-scan pointer-events-none absolute inset-x-3 top-3 h-px bg-indigo-400/70" />
      <span className="conclave-mark-ripple absolute right-[7%] bottom-[7%] h-3 w-3 rounded-full border border-emerald-400/70" />
    </div>
  );
}
