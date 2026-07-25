import Link from "next/link";

import { siteLinks } from "@/lib/site-links";

export function AuthLegalNotice() {
  return (
    <p className="mt-4 text-center text-[10px] leading-5 tracking-[0.06em] text-zinc-500 uppercase">
      By continuing, you agree to the{" "}
      <Link
        className="text-zinc-800 underline decoration-zinc-400 underline-offset-4 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
        href={siteLinks.terms}
      >
        Terms
      </Link>{" "}
      and acknowledge the{" "}
      <Link
        className="text-zinc-800 underline decoration-zinc-400 underline-offset-4 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
        href={siteLinks.privacy}
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
