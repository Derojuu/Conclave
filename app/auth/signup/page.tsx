import type { Metadata } from "next";

import { AuthEntryFooter } from "@/components/auth/auth-entry-footer";
import { AuthLegalNotice } from "@/components/auth/auth-legal-notice";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

const authErrors: Record<string, string> = {
  missing_code: "Google did not return an authorization code.",
  oauth_callback: "The Google sign-up callback could not be completed.",
  session_missing: "A secure session could not be established.",
  profile_sync: "Your account profile could not be created.",
};

export default async function SignupPage({
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
          <span className="h-1.5 w-1.5 bg-indigo-500" />
          <p className="text-[11px] font-bold tracking-[0.18em] text-zinc-500 uppercase">
            Confidential workspace
          </p>
        </div>
        <h1 className="mt-6 text-3xl leading-tight font-bold text-zinc-950 uppercase dark:text-white">
          Create your account
        </h1>
        <p className="mt-4 text-[13px] leading-6 text-zinc-500">
          Join Conclave to create an organization, manage confidential
          evaluation campaigns, or participate as an evaluator.
        </p>

        {error ? (
          <div
            className="mt-6 border border-rose-500/20 bg-rose-500/[0.05] px-4 py-3 text-[12px] leading-5 text-rose-500"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-8">
          <GoogleSignInButton intent="sign-up" next={next} />
          <AuthLegalNotice />
        </div>

        <AuthEntryFooter mode="signup" />
      </div>
    </AuthShell>
  );
}
