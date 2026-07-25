import { cn } from "@/utils/cn";

type LiveIndicatorProps = {
  label: string;
  tone?: "emerald" | "indigo" | "amber";
  className?: string;
};

const toneClasses = {
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  indigo: "bg-indigo-400",
} as const;

export function LiveIndicator({
  label,
  tone = "emerald",
  className,
}: LiveIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-[9px] font-bold tracking-[0.16em] text-zinc-500 uppercase",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full animate-pulse",
          toneClasses[tone],
        )}
      />
      {label}
    </div>
  );
}
