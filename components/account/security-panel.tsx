import { Clock3, LockKeyhole, ShieldCheck } from "lucide-react";

type SecurityPanelProps = {
  isSuperAdmin: boolean;
  lastSignInAt: Date | null;
};

export function SecurityPanel({
  isSuperAdmin,
  lastSignInAt,
}: SecurityPanelProps) {
  const lastSignIn = lastSignInAt
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(lastSignInAt)
    : "No recorded sign-in";

  return (
    <div>
      <div className="flex items-start gap-3">
        <LockKeyhole
          aria-hidden="true"
          className="mt-0.5 text-indigo-500"
          size={16}
        />
        <div>
          <p className="text-[12px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
            Security
          </p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">
            Your identity is managed by Google OAuth and validated by
            Supabase on protected server requests.
          </p>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-[10px] font-bold tracking-[0.08em] text-zinc-500 uppercase">
            Authentication
          </dt>
          <dd className="inline-flex items-center gap-2 text-[11px] font-bold text-zinc-950 dark:text-white">
            <ShieldCheck
              aria-hidden="true"
              className="text-emerald-500"
              size={13}
            />
            Google OAuth
          </dd>
        </div>
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-[10px] font-bold tracking-[0.08em] text-zinc-500 uppercase">
            Platform access
          </dt>
          <dd className="text-[11px] font-bold text-zinc-950 uppercase dark:text-white">
            {isSuperAdmin ? "Super admin" : "Standard user"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-5 py-4">
          <dt className="text-[10px] font-bold tracking-[0.08em] text-zinc-500 uppercase">
            Last sign-in
          </dt>
          <dd className="inline-flex items-center gap-2 text-right text-[11px] text-zinc-600 dark:text-zinc-300">
            <Clock3 aria-hidden="true" size={12} />
            {lastSignIn}
          </dd>
        </div>
      </dl>
    </div>
  );
}
