import Link from "next/link";

type AuthEntryFooterProps = {
  mode: "login" | "signup";
};

export function AuthEntryFooter({ mode }: AuthEntryFooterProps) {
  const isLogin = mode === "login";

  return (
    <div className="mt-8 border-t border-black/[0.06] pt-5 dark:border-white/[0.06]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[8px] leading-5 tracking-[0.08em] text-zinc-500 uppercase">
          {isLogin ? "New to Conclave?" : "Already have an account?"}
        </p>
        <Link
          className="text-[9px] font-bold tracking-[0.1em] text-indigo-600 uppercase transition-colors hover:text-indigo-500 dark:text-indigo-400"
          href={isLogin ? "/auth/signup" : "/auth/login"}
        >
          {isLogin ? "Create account" : "Sign in"}
        </Link>
      </div>
      <p className="mt-5 text-[8px] leading-5 tracking-[0.08em] text-zinc-500 uppercase">
        Wallet connection is optional and can be added later from account
        settings.
      </p>
    </div>
  );
}
