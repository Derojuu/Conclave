"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link2, Loader2, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";

type WalletLinkCardProps = {
  linkedAddress: string | null;
};

export function WalletLinkCard({ linkedAddress }: WalletLinkCardProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function linkWallet() {
    if (!address || !isConnected) {
      setMessage("Connect a wallet before linking it.");
      return;
    }

    setIsPending(true);
    setMessage(null);

    try {
      const challengeResponse = await fetch("/api/account/wallet/challenge");
      const challenge = (await challengeResponse.json()) as {
        error?: string;
        message?: string;
        nonce?: string;
      };

      if (
        !challengeResponse.ok ||
        !challenge.message ||
        !challenge.nonce
      ) {
        throw new Error(
          challenge.error ?? "Could not create a wallet challenge.",
        );
      }

      const signature = await signMessageAsync({
        message: challenge.message,
      });
      const response = await fetch("/api/account/wallet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address,
          nonce: challenge.nonce,
          signature,
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Wallet linking failed.");
      }

      setMessage("Wallet linked.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Wallet linking failed.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function unlinkWallet() {
    setIsPending(true);
    setMessage(null);
    const response = await fetch("/api/account/wallet", {
      method: "DELETE",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(result.error ?? "Wallet unlinking failed.");
      setIsPending(false);
      return;
    }

    if (isConnected) {
      await disconnectAsync();
    }

    setMessage("Wallet unlinked.");
    setIsPending(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
            Optional blockchain wallet
          </p>
          <p className="mt-2 max-w-xl text-[9px] leading-5 text-zinc-500">
            Authentication does not require a wallet. Link one only when you
            need to sign blockchain transactions.
          </p>
        </div>
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />
      </div>

      <div className="mt-6 border border-black/[0.06] bg-black/[0.015] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <p className="text-[8px] tracking-[0.12em] text-zinc-500 uppercase">
          Linked profile address
        </p>
        <p className="mt-2 break-all text-[10px] font-bold text-zinc-950 dark:text-white">
          {linkedAddress ?? "No wallet linked"}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={
            message?.includes("linked.")
              ? "text-[9px] text-emerald-500"
              : "text-[9px] text-rose-500"
          }
          role="status"
        >
          {message}
        </p>
        {linkedAddress ? (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-rose-500/20 px-5 py-3 text-[9px] font-bold tracking-[0.1em] text-rose-500 uppercase disabled:opacity-60"
            disabled={isPending}
            onClick={unlinkWallet}
            type="button"
          >
            {isPending ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={14} />
            ) : (
              <Unlink aria-hidden="true" size={14} />
            )}
            Unlink wallet
          </button>
        ) : (
          <button
            className="button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-zinc-950 px-5 py-3 text-[9px] font-bold tracking-[0.1em] uppercase disabled:opacity-60 dark:bg-white"
            disabled={isPending || !isConnected}
            onClick={linkWallet}
            type="button"
          >
            {isPending ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={14} />
            ) : (
              <Link2 aria-hidden="true" size={14} />
            )}
            Verify and link
          </button>
        )}
      </div>
    </div>
  );
}
