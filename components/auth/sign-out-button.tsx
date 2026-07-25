"use client";

import { Loader2, LogOut } from "lucide-react";
import { useState, useTransition } from "react";

import { signOutAction } from "@/app/auth/actions";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function SignOutButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(() => {
      void signOutAction();
    });
  }

  return (
    <>
      <button
        className="flex w-full items-center gap-3 border-t border-black/[0.06] px-4 py-3 text-left text-[11px] font-bold tracking-[0.08em] text-rose-500 uppercase hover:bg-rose-500/[0.05] disabled:cursor-wait dark:border-white/[0.06]"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        type="button"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={14} />
        ) : (
          <LogOut aria-hidden="true" size={14} />
        )}
        {isPending ? "Signing out..." : "Sign out"}
      </button>
      <ConfirmationDialog
        confirmLabel="Sign out"
        description="Your current Conclave session will end and you will return to the landing page."
        isPending={isPending}
        onConfirm={signOut}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Are you sure you want to sign out?"
      />
    </>
  );
}
