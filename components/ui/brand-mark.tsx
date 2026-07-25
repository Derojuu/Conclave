import Image from "next/image";

import { cn } from "@/utils/cn";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <Image
      alt=""
      className={cn(
        "h-8 w-8 shrink-0 rounded-sm",
        className,
      )}
      height={32}
      priority
      src="/images/conclave-icon.svg"
      width={32}
    />
  );
}
