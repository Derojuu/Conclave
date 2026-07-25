import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const authErrors: Record<string, string> = {
  missing_code: "Google did not return an authorization code.",
  oauth_callback: "The Google sign-in callback could not be completed.",
  session_missing: "A secure session could not be established.",
  profile_sync: "Your account profile could not be created.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";
  const error = params.error ? authErrors[params.error] : null;

  return (
    <AuthShell>
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 bg-emerald-500" />
          <p className="text-[9px] font-bold tracking-[0.18em] text-zinc-500 uppercase">
            Organization access
          </p>
        </div>
        <h1 className="mt-6 text-3xl leading-tight font-bold text-zinc-950 uppercase dark:text-white">
          Sign in to Conclave
        </h1>
        <p className="mt-4 text-[11px] leading-6 text-zinc-500">
          Access confidential campaigns, evaluations, and verified decision
          results with your organization identity.
        </p>

        {error ? (
          <div
            className="mt-6 border border-rose-500/20 bg-rose-500/[0.05] px-4 py-3 text-[10px] leading-5 text-rose-500"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-8">
          <GoogleSignInButton next={next} />
        </div>

        <div className="mt-8 border-t border-black/[0.06] pt-5 dark:border-white/[0.06]">
          <p className="text-[8px] leading-5 tracking-[0.08em] text-zinc-500 uppercase">
            Wallet connection is optional and can be added later from account
            settings.
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
