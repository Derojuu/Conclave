import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginLoading() {
  return (
    <AuthShell>
      <div aria-live="polite" className="animate-pulse p-6 sm:p-8">
        <div className="h-2 w-36 bg-zinc-300 dark:bg-white/10" />
        <div className="mt-7 h-9 w-72 max-w-full bg-zinc-300 dark:bg-white/10" />
        <div className="mt-5 h-16 w-full bg-zinc-200 dark:bg-white/[0.06]" />
        <div className="mt-8 h-12 w-full bg-zinc-300 dark:bg-white/10" />
        <span className="sr-only">Loading sign in</span>
      </div>
    </AuthShell>
  );
}
