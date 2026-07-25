import { cn } from "@/utils/cn";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br from-indigo-400 to-indigo-700 text-sm font-bold text-white",
        className,
      )}
    >
      C
      <span className="absolute right-1 bottom-1 h-1.5 w-1.5 rounded-full border border-indigo-700 bg-emerald-400" />
    </span>
  );
}
