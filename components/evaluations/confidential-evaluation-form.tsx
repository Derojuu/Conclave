"use client";

import { createViemHandleClient } from "@iexec-nox/handle";
import { Loader2, LockKeyhole, Star } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { isAddress, type Address } from "viem";
import { sepolia } from "viem/chains";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  confidentialDecisionEngineAbi,
  NOX_CHAIN_ID,
  NOX_SCORE_SCALE,
  toNoxId,
} from "@/lib/nox/contract";
import { computeNoxWeightedScore } from "@/lib/nox/score";

type Criterion = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  type: "SCALE" | "NUMERIC" | "BOOLEAN" | "RUBRIC" | "STAR" | "PASS_FAIL";
  weight: number;
  minScore: number;
  maxScore: number;
};

type FormValues = {
  criteria: Array<{ value: string | number | boolean | null }>;
};

type Props = {
  organizationId: string;
  campaignId: string;
  submissionId: string;
  linkedWalletAddress: string | null;
  noxContractAddress: string | null;
  template: { instructions: string; criteria: Criterion[] };
  existingEvaluation: {
    status: "DRAFT" | "SEALED" | "SUBMITTED" | "INCLUDED" | "EXCLUDED";
    payloadHash: string | null;
    submittedAt: string | null;
  } | null;
};

function initialValue(criterion: Criterion) {
  return ["NUMERIC", "SCALE", "STAR"].includes(criterion.type)
    ? criterion.minScore
    : null;
}

export function ConfidentialEvaluationForm({
  organizationId,
  campaignId,
  submissionId,
  linkedWalletAddress,
  noxContractAddress,
  template,
  existingEvaluation,
}: Props) {
  const submitted = ["SUBMITTED", "INCLUDED"].includes(
    existingEvaluation?.status ?? "",
  );
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data: walletClient } = useWalletClient({ chainId: sepolia.id });
  const [isPending, setIsPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { control, register, getValues, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      criteria: template.criteria.map((criterion) => ({
        value: initialValue(criterion),
      })),
    },
  });

  async function submit() {
    if (
      !noxContractAddress ||
      !isAddress(noxContractAddress) ||
      !walletClient ||
      !publicClient ||
      !address
    ) {
      setMessage("Connect the linked wallet on Ethereum Sepolia.");
      setConfirmOpen(false);
      return;
    }
    if (
      !linkedWalletAddress ||
      linkedWalletAddress.toLowerCase() !== address.toLowerCase()
    ) {
      setMessage(
        "The connected wallet must match the wallet linked to your account.",
      );
      setConfirmOpen(false);
      return;
    }
    if (chainId !== NOX_CHAIN_ID) {
      setMessage("Switch the connected wallet to Ethereum Sepolia.");
      setConfirmOpen(false);
      return;
    }

    setIsPending(true);
    setMessage("Encrypting the weighted score with iExec Nox...");
    try {
      const values = getValues();
      const criteria = template.criteria.map((criterion, index) => ({
        ...criterion,
        value: values.criteria[index]?.value ?? null,
      }));
      if (
        criteria.some(
          (criterion) => criterion.value === null || criterion.value === "",
        )
      ) {
        throw new Error("Complete every scored criterion before submitting.");
      }
      const weightedScore = computeNoxWeightedScore(criteria);
      const handleClient = await createViemHandleClient(walletClient);
      const encrypted = await handleClient.encryptInput(
        weightedScore,
        "uint256",
        noxContractAddress as Address,
      );
      const transactionHash = await walletClient.writeContract({
        address: noxContractAddress as Address,
        abi: confidentialDecisionEngineAbi,
        functionName: "submitScore",
        args: [
          toNoxId(campaignId),
          toNoxId(submissionId),
          encrypted.handle,
          encrypted.handleProof,
        ],
        chain: sepolia,
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
      });
      if (receipt.status !== "success") {
        throw new Error("The Nox score transaction reverted.");
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/evaluations`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            handle: encrypted.handle,
            handleProof: encrypted.handleProof,
            transactionHash,
            contractAddress: noxContractAddress,
            chainId: NOX_CHAIN_ID,
            scoreScale: NOX_SCORE_SCALE,
          }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error ?? "Evaluation recording failed.");
      setMessage("Evaluation submitted and confirmed on Ethereum Sepolia.");
      setConfirmOpen(false);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Nox submission failed.",
      );
      setConfirmOpen(false);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      className="space-y-8"
      onSubmit={handleSubmit(() => setConfirmOpen(true))}
    >
      <div className="border-y border-black/[0.06] py-5 dark:border-white/[0.06]">
        <p className="text-[11px] leading-5 text-zinc-500">
          {template.instructions}
        </p>
      </div>
      <div className="space-y-7">
        {template.criteria.map((criterion, index) => (
          <section
            className="border-b border-black/[0.06] pb-6 dark:border-white/[0.06]"
            key={criterion.id}
          >
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-[13px] font-bold text-zinc-950 dark:text-white">
                  {criterion.label}
                </h2>
                {criterion.description ? (
                  <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                    {criterion.description}
                  </p>
                ) : null}
              </div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase">
                Weight {criterion.weight}
              </span>
            </div>
            <div className="mt-5">
              {criterion.type === "STAR" ? (
                <Controller
                  control={control}
                  name={`criteria.${index}.value`}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        {
                          length: Math.min(
                            10,
                            Math.max(
                              1,
                              Math.trunc(
                                criterion.maxScore - criterion.minScore + 1,
                              ),
                            ),
                          ),
                        },
                        (_, offset) => criterion.minScore + offset,
                      ).map((value) => (
                        <button
                          aria-label={`${value} stars`}
                          className={
                            Number(field.value) >= value
                              ? "flex h-10 w-10 items-center justify-center border border-amber-500 text-amber-500"
                              : "flex h-10 w-10 items-center justify-center border border-black/[0.08] text-zinc-400 dark:border-white/[0.08]"
                          }
                          key={value}
                          onClick={() => field.onChange(value)}
                          type="button"
                        >
                          <Star
                            fill={
                              Number(field.value) >= value
                                ? "currentColor"
                                : "none"
                            }
                            size={15}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                />
              ) : criterion.type === "BOOLEAN" ? (
                <Controller
                  control={control}
                  name={`criteria.${index}.value`}
                  render={({ field }) => (
                    <select
                      className="h-11 w-full max-w-xs border border-black/[0.08] bg-transparent px-3 text-[12px]"
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? null
                            : event.target.value === "true",
                        )
                      }
                      value={
                        field.value === null
                          ? ""
                          : field.value
                            ? "true"
                            : "false"
                      }
                    >
                      <option value="">Select response</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  )}
                />
              ) : criterion.type === "PASS_FAIL" ? (
                <select
                  className="h-11 w-full max-w-xs border border-black/[0.08] bg-transparent px-3 text-[12px]"
                  {...register(`criteria.${index}.value`)}
                >
                  <option value="">Select outcome</option>
                  <option value="PASS">Pass</option>
                  <option value="FAIL">Fail</option>
                </select>
              ) : criterion.type === "RUBRIC" ? (
                <textarea
                  className="min-h-24 w-full border border-black/[0.08] bg-transparent p-3 text-[12px]"
                  {...register(`criteria.${index}.value`)}
                />
              ) : (
                <input
                  className="h-11 w-36 border border-black/[0.08] bg-transparent px-3 text-[13px]"
                  max={criterion.maxScore}
                  min={criterion.minScore}
                  step="any"
                  type="number"
                  {...register(`criteria.${index}.value`, {
                    valueAsNumber: true,
                  })}
                />
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="flex flex-col gap-4 border-t border-black/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <p
          className="flex items-center gap-2 text-[10px] text-zinc-500"
          role="status"
        >
          <LockKeyhole size={12} />
          {message ??
            "Your weighted score is encrypted by Nox before the transaction."}
        </p>
        <button
          className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[10px] font-bold uppercase disabled:opacity-50 dark:bg-white"
          disabled={submitted || isPending || !noxContractAddress}
          type="submit"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <LockKeyhole size={14} />
          )}
          {submitted ? "Submitted" : "Encrypt and submit"}
        </button>
      </div>
      <ConfirmationDialog
        confirmLabel="Submit on Sepolia"
        description="This permanently submits your Nox-encrypted weighted score to the confidential campaign contract."
        isPending={isPending}
        onConfirm={() => void submit()}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Submit confidential evaluation?"
      />
    </form>
  );
}
