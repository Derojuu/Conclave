"use client";

import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  next: string;
};

export function GoogleSignInButton({ next }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-sm bg-zinc-950 px-5 py-3 text-[10px] font-bold tracking-[0.1em] text-white uppercase transition-colors hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        disabled={isLoading}
        onClick={signIn}
        type="button"
      >
        {isLoading ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={17} />
        ) : (
          <LogIn aria-hidden="true" size={17} />
        )}
        {isLoading ? "Redirecting to Google" : "Continue with Google"}
      </Button>
      {error ? (
        <p className="mt-4 text-[10px] leading-5 text-rose-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
