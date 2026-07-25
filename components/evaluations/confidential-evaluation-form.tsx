"use client";

import { Check, Loader2, LockKeyhole, Save, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
} from "react-hook-form";

import {
  EVALUATION_RECOMMENDATIONS,
  evaluationRecommendationLabels,
  type EvaluationRecommendation,
} from "@/constants/evaluation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { encryptEvaluationPayload } from "@/lib/confidential/browser-encryption";
import {
  confidentialEvaluationPayloadSchema,
  type ConfidentialEvaluationPayload,
} from "@/lib/validation/evaluation";

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

type EvaluationFormValues = {
  criteria: Array<{
    criterionId: string;
    key: string;
    value: string | number | boolean | null;
    privateComment: string;
  }>;
  overallRecommendation: EvaluationRecommendation;
  privateComments: string;
};

type ConfidentialEvaluationFormProps = {
  organizationId: string;
  campaignId: string;
  submissionId: string;
  evaluatorRef: string;
  template: {
    id: string;
    version: number;
    instructions: string;
    criteria: Criterion[];
  };
  encryptionConfig: {
    publicKey: string;
    keyReference: string;
  } | null;
  existingEvaluation: {
    status: "DRAFT" | "SEALED" | "SUBMITTED" | "INCLUDED" | "EXCLUDED";
    payloadHash: string | null;
    submittedAt: string | null;
  } | null;
};

function initialValue(criterion: Criterion) {
  if (criterion.type === "NUMERIC" || criterion.type === "SCALE") {
    return criterion.minScore;
  }

  return null;
}

function normalizeCriterionValue(
  criterion: Criterion,
  value: string | number | boolean | null,
) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  if (
    criterion.type === "NUMERIC" ||
    criterion.type === "SCALE" ||
    criterion.type === "STAR"
  ) {
    return Number(value);
  }

  return value;
}

export function ConfidentialEvaluationForm({
  organizationId,
  campaignId,
  submissionId,
  evaluatorRef,
  template,
  encryptionConfig,
  existingEvaluation,
}: ConfidentialEvaluationFormProps) {
  const submitted =
    existingEvaluation?.status === "SUBMITTED" ||
    existingEvaluation?.status === "INCLUDED";
  const [message, setMessage] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutosaveFingerprint = useRef<string | null>(null);
  const {
    control,
    register,
    getValues,
    handleSubmit,
    formState: { isDirty },
  } = useForm<EvaluationFormValues>({
    defaultValues: {
      criteria: template.criteria.map((criterion) => ({
        criterionId: criterion.id,
        key: criterion.key,
        value: initialValue(criterion),
        privateComment: "",
      })),
      overallRecommendation: "NEUTRAL",
      privateComments: "",
    },
  });
  const watchedValues = useWatch({ control });

  const persist = useCallback(
    async (finalSubmission: boolean, quiet = false) => {
      if (!encryptionConfig || submitted) {
        return false;
      }

      const values = getValues();
      const criteria = template.criteria.map((criterion, index) => ({
        criterionId: criterion.id,
        key: criterion.key,
        value: normalizeCriterionValue(
          criterion,
          values.criteria[index]?.value ?? null,
        ),
        privateComment:
          values.criteria[index]?.privateComment.trim() || undefined,
      }));

      if (finalSubmission) {
        const missing = criteria.find((criterion) => criterion.value === null);
        if (missing) {
          setMessage("Complete every criterion before submitting.");
          return false;
        }

        for (const [index, response] of criteria.entries()) {
          const criterion = template.criteria[index];
          if (
            typeof response.value === "number" &&
            (response.value < criterion.minScore ||
              response.value > criterion.maxScore)
          ) {
            setMessage(
              `${criterion.label} must be between ${criterion.minScore} and ${criterion.maxScore}.`,
            );
            return false;
          }
        }
      }

      setIsEncrypting(true);
      if (!quiet) {
        setMessage(
          finalSubmission
            ? "Encrypting and sealing evaluation..."
            : "Saving encrypted draft...",
        );
      }

      try {
        const payload: ConfidentialEvaluationPayload =
          confidentialEvaluationPayloadSchema.parse({
            schemaVersion: 1,
            campaignId,
            submissionId,
            evaluatorRef,
            templateId: template.id,
            templateVersion: template.version,
            criteria,
            overallRecommendation: values.overallRecommendation,
            privateComments: values.privateComments.trim() || undefined,
            completed: finalSubmission,
            preparedAt: new Date().toISOString(),
          });
        const envelope = await encryptEvaluationPayload({
          payload,
          publicKey: encryptionConfig.publicKey,
          keyReference: encryptionConfig.keyReference,
        });
        const response = await fetch(
          `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/evaluations`,
          {
            method: finalSubmission ? "POST" : "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(envelope),
          },
        );
        const result = (await response.json()) as {
          error?: string;
          evaluation?: { status: string; payloadHash: string };
        };

        if (!response.ok || !result.evaluation) {
          setMessage(result.error ?? "Encrypted evaluation could not be saved.");
          return false;
        }

        setLastSavedAt(new Date());
        setMessage(
          finalSubmission
            ? "Evaluation submitted. Only encrypted content was stored."
            : quiet
              ? null
              : "Encrypted draft saved.",
        );

        if (finalSubmission) {
          window.location.reload();
        }

        return true;
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Evaluation encryption failed.",
        );
        return false;
      } finally {
        setIsEncrypting(false);
      }
    },
    [
      campaignId,
      encryptionConfig,
      evaluatorRef,
      getValues,
      organizationId,
      submissionId,
      submitted,
      template,
    ],
  );

  useEffect(() => {
    if (!isDirty || !encryptionConfig || submitted || isEncrypting) {
      return;
    }

    const fingerprint = JSON.stringify(watchedValues);
    if (fingerprint === lastAutosaveFingerprint.current) {
      return;
    }

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = setTimeout(() => {
      lastAutosaveFingerprint.current = fingerprint;
      void persist(false, true);
    }, 1800);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [
    encryptionConfig,
    isDirty,
    isEncrypting,
    persist,
    submitted,
    watchedValues,
  ]);

  const submit = handleSubmit(() => setConfirmOpen(true));

  if (submitted) {
    return (
      <div className="border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
        <div className="flex items-center gap-3 text-emerald-500">
          <Check aria-hidden="true" size={18} />
          <p className="text-[12px] font-bold tracking-[0.1em] uppercase">
            Confidential evaluation submitted
          </p>
        </div>
        <p className="mt-4 max-w-2xl text-[11px] leading-5 text-zinc-500">
          The application stores only the encrypted payload and its integrity
          commitment. Individual responses cannot be viewed from this page.
        </p>
        {existingEvaluation?.payloadHash ? (
          <p className="mt-5 break-all font-mono text-[9px] text-zinc-500">
            {existingEvaluation.payloadHash}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={submit}>
      {!encryptionConfig ? (
        <div className="border border-amber-500/20 bg-amber-500/[0.04] p-5 text-[11px] leading-5 text-amber-600 dark:text-amber-400">
          Confidential evaluation encryption is not configured. An organization
          administrator must configure the Nox public key before evaluations
          can be submitted.
        </div>
      ) : null}

      {existingEvaluation?.status === "SEALED" ? (
        <div className="border border-indigo-500/20 bg-indigo-500/[0.04] p-4 text-[10px] text-indigo-500">
          An encrypted draft checkpoint exists. Saving again replaces that
          checkpoint; its contents are never returned by the server.
        </div>
      ) : null}

      {template.instructions ? (
        <div className="border-y border-black/[0.06] py-5 dark:border-white/[0.06]">
          <p className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
            Instructions
          </p>
          <p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-zinc-600 dark:text-zinc-400">
            {template.instructions}
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        {template.criteria.map((criterion, index) => (
          <section
            className="border-b border-black/[0.06] pb-6 dark:border-white/[0.06]"
            key={criterion.id}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[13px] font-bold text-zinc-950 dark:text-white">
                  {criterion.label}
                </h2>
                {criterion.description ? (
                  <p className="mt-2 max-w-2xl text-[11px] leading-5 text-zinc-500">
                    {criterion.description}
                  </p>
                ) : null}
              </div>
              <span className="text-[9px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
                Weight {criterion.weight}
              </span>
            </div>

            <input
              type="hidden"
              {...register(`criteria.${index}.criterionId`)}
            />
            <input type="hidden" {...register(`criteria.${index}.key`)} />

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
                                criterion.maxScore -
                                  criterion.minScore +
                                  1,
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
                              ? "flex h-10 w-10 items-center justify-center border border-amber-500 bg-amber-500/[0.08] text-amber-500"
                              : "flex h-10 w-10 items-center justify-center border border-black/[0.08] text-zinc-400 dark:border-white/[0.08]"
                          }
                          key={value}
                          onClick={() => field.onChange(value)}
                          type="button"
                        >
                          <Star
                            aria-hidden="true"
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
              ) : criterion.type === "PASS_FAIL" ? (
                <select
                  className="h-11 w-full max-w-xs border border-black/[0.08] bg-[#EBE8E1] px-3 text-[12px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#111]"
                  {...register(`criteria.${index}.value`)}
                >
                  <option value="">Select outcome</option>
                  <option value="PASS">Pass</option>
                  <option value="FAIL">Fail</option>
                </select>
              ) : criterion.type === "BOOLEAN" ? (
                <Controller
                  control={control}
                  name={`criteria.${index}.value`}
                  render={({ field }) => (
                    <select
                      className="h-11 w-full max-w-xs border border-black/[0.08] bg-[#EBE8E1] px-3 text-[12px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#111]"
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(
                          value === "" ? null : value === "true",
                        );
                      }}
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
              ) : criterion.type === "RUBRIC" ? (
                <textarea
                  className="min-h-28 w-full resize-y border border-black/[0.08] bg-black/[0.02] p-3 text-[12px] leading-5 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
                  placeholder="Enter the rubric outcome"
                  {...register(`criteria.${index}.value`)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    className="h-11 w-36 border border-black/[0.08] bg-black/[0.02] px-3 text-[13px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
                    max={criterion.maxScore}
                    min={criterion.minScore}
                    step="any"
                    type="number"
                    {...register(`criteria.${index}.value`, {
                      valueAsNumber: true,
                    })}
                  />
                  <span className="text-[10px] text-zinc-500">
                    {criterion.minScore} to {criterion.maxScore}
                  </span>
                </div>
              )}
            </div>

            <textarea
              className="mt-4 min-h-20 w-full resize-y border border-black/[0.08] bg-black/[0.02] p-3 text-[11px] leading-5 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
              placeholder="Private criterion comment (optional)"
              {...register(`criteria.${index}.privateComment`)}
            />
          </section>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label
            className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
            htmlFor="overall-recommendation"
          >
            Overall recommendation
          </label>
          <select
            className="mt-2 h-11 w-full border border-black/[0.08] bg-[#EBE8E1] px-3 text-[12px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#111]"
            id="overall-recommendation"
            {...register("overallRecommendation")}
          >
            {EVALUATION_RECOMMENDATIONS.map((recommendation) => (
              <option key={recommendation} value={recommendation}>
                {evaluationRecommendationLabels[recommendation]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
            htmlFor="private-comments"
          >
            Private overall comments
          </label>
          <textarea
            className="mt-2 min-h-24 w-full resize-y border border-black/[0.08] bg-black/[0.02] p-3 text-[11px] leading-5 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
            id="private-comments"
            {...register("privateComments")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-black/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <div>
          <p
            className={
              message?.startsWith("Evaluation submitted") ||
              message === "Encrypted draft saved."
                ? "text-[11px] text-emerald-500"
                : "text-[11px] text-zinc-500"
            }
            role="status"
          >
            {message ??
              (lastSavedAt
                ? `Encrypted checkpoint saved ${lastSavedAt.toLocaleTimeString()}`
                : "Changes autosave as an encrypted checkpoint.")}
          </p>
          <p className="mt-2 flex items-center gap-2 text-[9px] text-zinc-500">
            <LockKeyhole aria-hidden="true" size={11} />
            Plaintext responses never leave this browser.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-black/[0.08] px-4 text-[10px] font-bold uppercase disabled:opacity-50 dark:border-white/[0.08]"
            disabled={!encryptionConfig || isEncrypting}
            onClick={() => void persist(false)}
            type="button"
          >
            {isEncrypting ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={13} />
            ) : (
              <Save aria-hidden="true" size={13} />
            )}
            Save encrypted draft
          </button>
          <button
            className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[10px] font-bold tracking-[0.1em] uppercase disabled:opacity-50 dark:bg-white"
            disabled={!encryptionConfig || isEncrypting}
            type="submit"
          >
            {isEncrypting ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={13} />
            ) : (
              <LockKeyhole aria-hidden="true" size={13} />
            )}
            Seal and submit
          </button>
        </div>
      </div>
      <ConfirmationDialog
        confirmLabel="Seal and submit"
        description="Your evaluation will be encrypted, sealed, and submitted for confidential computation. You will not be able to view or edit the plaintext responses afterward."
        isPending={isEncrypting}
        onConfirm={() => {
          void persist(true).then((submittedSuccessfully) => {
            if (!submittedSuccessfully) setConfirmOpen(false);
          });
        }}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Are you sure you want to submit this evaluation?"
      />
    </form>
  );
}
