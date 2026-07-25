import { cn } from "@/utils/cn";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          align === "center" && "justify-center",
        )}
      >
        <span className="h-1.5 w-1.5 bg-emerald-500" />
        <p className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-5 text-3xl leading-[1.02] font-bold text-zinc-950 uppercase sm:text-4xl lg:text-5xl dark:text-white">
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-xs leading-6 text-zinc-500 sm:text-sm">
        {description}
      </p>
    </div>
  );
}
