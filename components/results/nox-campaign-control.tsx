"use client";

import { createViemHandleClient } from "@iexec-nox/handle";
import { Cpu, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { isAddress, type Address, type Hex } from "viem";
import { sepolia } from "viem/chains";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWalletClient,
} from "wagmi";

import { Button } from "@/components/ui/button";
import {
  confidentialDecisionEngineAbi,
  NOX_CHAIN_ID,
  toNoxId,
} from "@/lib/nox/contract";

type Props = {
  organizationId: string;
  campaignId: string;
  linkedWalletAddress: string | null;
  contractAddress: string | null;
  submissions: Array<{ id: string; title: string }>;
  evaluatorWallets: string[];
  expectedEvaluatorCount: number;
};

export function NoxCampaignControl({
  organizationId,
  campaignId,
  linkedWalletAddress,
  contractAddress,
  submissions,
  evaluatorWallets,
  expectedEvaluatorCount,
}: Props) {
  const enabled = Boolean(contractAddress && isAddress(contractAddress));
  const address = enabled ? (contractAddress as Address) : undefined;
  const campaignKey = toNoxId(campaignId);
  const { address: connectedAddress, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data: walletClient } = useWalletClient({ chainId: sepolia.id });
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const storageKey = `conclave:nox-publication:${campaignId}`;
  const [publishTransactionHash, setPublishTransactionHash] =
    useState<Hex | null>(() => {
      if (typeof window === "undefined") return null;
      const storedHash = window.localStorage.getItem(storageKey);
      return /^0x[a-fA-F0-9]{64}$/.test(storedHash ?? "")
        ? (storedHash as Hex)
        : null;
    });
  const { data: campaignInfo, refetch } = useReadContract({
    address,
    abi: confidentialDecisionEngineAbi,
    functionName: "campaignInfo",
    args: [campaignKey],
    chainId: NOX_CHAIN_ID,
    query: { enabled },
  });
  const exists = campaignInfo?.[1] ?? false;
  const finalized = campaignInfo?.[2] ?? false;
  const published = campaignInfo?.[3] ?? false;

  function requireWallet() {
    if (!address || !walletClient || !publicClient || !connectedAddress) {
      throw new Error("Connect the linked wallet on Ethereum Sepolia.");
    }
    if (chainId !== NOX_CHAIN_ID)
      throw new Error("Switch to Ethereum Sepolia.");
    if (
      !linkedWalletAddress ||
      linkedWalletAddress.toLowerCase() !== connectedAddress.toLowerCase()
    ) {
      throw new Error(
        "The connected wallet must match your linked account wallet.",
      );
    }
    return { address, walletClient, publicClient };
  }

  async function initialize() {
    setIsPending(true);
    setMessage("Creating the confidential campaign on Sepolia...");
    try {
      const clients = requireWallet();
      if (!submissions.length)
        throw new Error("Add at least one submission first.");
      if (
        evaluatorWallets.length !== expectedEvaluatorCount ||
        !evaluatorWallets.length ||
        evaluatorWallets.some((wallet) => !isAddress(wallet))
      ) {
        throw new Error(
          "Every assigned evaluator must link a valid wallet first.",
        );
      }
      if (
        new Set(evaluatorWallets.map((wallet) => wallet.toLowerCase())).size !==
        evaluatorWallets.length
      ) {
        throw new Error("Each evaluator must link a unique wallet address.");
      }
      const hash = await clients.walletClient.writeContract({
        address: clients.address,
        abi: confidentialDecisionEngineAbi,
        functionName: "createCampaign",
        args: [
          campaignKey,
          submissions.map((submission) => toNoxId(submission.id)),
          evaluatorWallets as Address[],
        ],
        chain: sepolia,
      });
      const receipt = await clients.publicClient.waitForTransactionReceipt({
        hash,
      });
      if (receipt.status !== "success")
        throw new Error("Campaign creation reverted.");
      await refetch();
      setMessage("Confidential campaign initialized on Ethereum Sepolia.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Campaign initialization failed.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function finalizeAndPublish() {
    setIsPending(true);
    setMessage("Finalizing encrypted aggregates with Nox...");
    try {
      const clients = requireWallet();
      if (published) {
        if (!publishTransactionHash) {
          throw new Error(
            "The result is already on-chain, but its publication transaction is not available in this browser.",
          );
        }
        await recordPublishedResult(publishTransactionHash);
        return;
      }
      if (!finalized) {
        const finalizeHash = await clients.walletClient.writeContract({
          address: clients.address,
          abi: confidentialDecisionEngineAbi,
          functionName: "finalizeCampaign",
          args: [campaignKey],
          chain: sepolia,
        });
        const receipt = await clients.publicClient.waitForTransactionReceipt({
          hash: finalizeHash,
        });
        if (receipt.status !== "success")
          throw new Error("Campaign finalization reverted.");
      }

      setMessage("Requesting proofs for aggregate totals...");
      const handleClient = await createViemHandleClient(clients.walletClient);
      const proofs: Hex[] = [];
      for (const submission of submissions) {
        const handle = await clients.publicClient.readContract({
          address: clients.address,
          abi: confidentialDecisionEngineAbi,
          functionName: "getAggregateHandle",
          args: [campaignKey, toNoxId(submission.id)],
        });
        const decrypted = await handleClient.publicDecrypt(
          handle as Hex & { __solidityType?: "uint256" },
        );
        proofs.push(decrypted.decryptionProof);
      }

      const publishHash = await clients.walletClient.writeContract({
        address: clients.address,
        abi: confidentialDecisionEngineAbi,
        functionName: "publishResults",
        args: [campaignKey, proofs],
        chain: sepolia,
      });
      const publishReceipt =
        await clients.publicClient.waitForTransactionReceipt({
          hash: publishHash,
        });
      if (publishReceipt.status !== "success")
        throw new Error("Result publication reverted.");

      setPublishTransactionHash(publishHash);
      window.localStorage.setItem(storageKey, publishHash);
      await recordPublishedResult(publishHash);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Nox finalization failed.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function recordPublishedResult(transactionHash: Hex) {
    setMessage("Recording the verified Nox result...");
    const response = await fetch(
      `/api/organizations/${organizationId}/campaigns/${campaignId}/computations`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash }),
      },
    );
    const result = (await response.json()) as { error?: string };
    if (!response.ok)
      throw new Error(result.error ?? "Result recording failed.");
    await refetch();
    window.localStorage.removeItem(storageKey);
    setPublishTransactionHash(null);
    setMessage("Nox aggregate decision verified and published.");
    window.location.reload();
  }

  if (!enabled) {
    return (
      <p className="text-[10px] text-rose-500">
        Nox contract address is not configured.
      </p>
    );
  }
  return (
    <div>
      <Button
        disabled={isPending}
        onClick={() => void (exists ? finalizeAndPublish() : initialize())}
        type="button"
      >
        {isPending ? (
          <Loader2 className="animate-spin" size={14} />
        ) : exists ? (
          <ShieldCheck size={14} />
        ) : (
          <Cpu size={14} />
        )}
        {published
          ? "Record published result"
          : exists
            ? "Finalize Nox decision"
            : "Initialize Nox campaign"}
      </Button>
      {message ? (
        <p className="mt-3 text-[10px] text-zinc-500" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
