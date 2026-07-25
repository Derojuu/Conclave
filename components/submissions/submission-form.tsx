"use client";

import { FolderPlus, Link2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import {
  SUBMISSION_LINK_TYPES,
  submissionLinkTypeLabels,
} from "@/constants/submission";
import {
  submissionSchema,
  type SubmissionInput,
} from "@/lib/validation/submission";

type SubmissionFormProps = {
  organizationId: string;
  campaignId: string;
  submissionId?: string;
  disabled?: boolean;
  defaultValues?: SubmissionInput;
};

export function SubmissionForm({
  organizationId,
  campaignId,
  submissionId,
  disabled = false,
  defaultValues,
}: SubmissionFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionInput>({
    defaultValues: defaultValues ?? {
      title: "",
      description: "",
      kind: "",
      metadata: {},
      links: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "links",
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const parsed = submissionSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (
          field === "title" ||
          field === "description" ||
          field === "kind"
        ) {
          setError(field, { message: issue.message });
        }
      });
      setMessage(
        parsed.error.issues[0]?.message ?? "Review the submission details.",
      );
      return;
    }

    const response = await fetch(
      submissionId
        ? `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}`
        : `/api/organizations/${organizationId}/campaigns/${campaignId}/submissions`,
      {
        method: submissionId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      },
    );
    const result = (await response.json()) as {
      error?: string;
      submission?: { id: string };
    };

    if (!response.ok || !result.submission) {
      setMessage(result.error ?? "Submission could not be saved.");
      return;
    }

    if (submissionId) {
      setMessage("Submission details saved.");
      router.refresh();
      return;
    }

    router.push(
      `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${result.submission.id}`,
    );
    router.refresh();
  });

  return (
    <form className="space-y-7" onSubmit={onSubmit}>
      <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
        <div>
          <label
            className="text-[8px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
            htmlFor="submission-title"
          >
            Submission title
          </label>
          <input
            className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[11px] outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.02]"
            disabled={disabled}
            id="submission-title"
            {...register("title")}
          />
          {errors.title ? (
            <p className="mt-2 text-[9px] text-rose-500" role="alert">
              {errors.title.message}
            </p>
          ) : null}
        </div>
        <div>
          <label
            className="text-[8px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
            htmlFor="submission-kind"
          >
            Type
          </label>
          <input
            className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[11px] outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.02]"
            disabled={disabled}
            id="submission-kind"
            placeholder="Candidate, proposal, vendor..."
            {...register("kind")}
          />
          {errors.kind ? (
            <p className="mt-2 text-[9px] text-rose-500" role="alert">
              {errors.kind.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          className="text-[8px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
          htmlFor="submission-description"
        >
          Description
        </label>
        <textarea
          className="mt-2 min-h-36 w-full resize-y border border-black/[0.08] bg-black/[0.02] p-3 text-[11px] leading-6 outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.02]"
          disabled={disabled}
          id="submission-description"
          {...register("description")}
        />
        {errors.description ? (
          <p className="mt-2 text-[9px] text-rose-500" role="alert">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <section className="border-y border-black/[0.06] py-6 dark:border-white/[0.06]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[9px] font-bold tracking-[0.1em] text-zinc-950 uppercase dark:text-white">
              <Link2 aria-hidden="true" size={13} />
              Links
            </p>
            <p className="mt-2 text-[8px] text-zinc-500">
              Add only the resources relevant to this submission.
            </p>
          </div>
          <button
            className="inline-flex min-h-9 items-center gap-2 border border-black/[0.08] px-3 text-[8px] font-bold uppercase disabled:opacity-50 dark:border-white/[0.08]"
            disabled={disabled || fields.length >= 12}
            onClick={() =>
              append({ type: "WEBSITE", label: "Website", url: "" })
            }
            type="button"
          >
            <Plus aria-hidden="true" size={12} />
            Add link
          </button>
        </div>

        {fields.length ? (
          <div className="mt-5 space-y-3">
            {fields.map((field, index) => (
              <div
                className="grid gap-3 border border-black/[0.06] p-3 sm:grid-cols-[150px_180px_1fr_40px] dark:border-white/[0.06]"
                key={field.id}
              >
                <select
                  aria-label={`Link ${index + 1} type`}
                  className="h-10 border border-black/[0.08] bg-[#EBE8E1] px-2 text-[8px] dark:border-white/[0.08] dark:bg-[#111]"
                  disabled={disabled}
                  {...register(`links.${index}.type`)}
                >
                  {SUBMISSION_LINK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {submissionLinkTypeLabels[type]}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Link ${index + 1} label`}
                  className="h-10 border border-black/[0.08] bg-black/[0.02] px-3 text-[9px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
                  disabled={disabled}
                  placeholder="Label"
                  {...register(`links.${index}.label`)}
                />
                <input
                  aria-label={`Link ${index + 1} URL`}
                  className="h-10 min-w-0 border border-black/[0.08] bg-black/[0.02] px-3 text-[9px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
                  disabled={disabled}
                  inputMode="url"
                  placeholder="https://"
                  {...register(`links.${index}.url`)}
                />
                <button
                  aria-label={`Remove link ${index + 1}`}
                  className="flex h-10 w-10 items-center justify-center border border-rose-500/20 text-rose-500 disabled:opacity-50"
                  disabled={disabled}
                  onClick={() => remove(index)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 border border-dashed border-black/[0.08] py-7 text-center text-[8px] text-zinc-500 dark:border-white/[0.08]">
            No links added.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={
            message === "Submission details saved."
              ? "text-[9px] text-emerald-500"
              : "text-[9px] text-rose-500"
          }
          role="status"
        >
          {message ??
            (disabled
              ? "Submission details are locked because evaluation has started."
              : null)}
        </p>
        <button
          className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 py-3 text-[9px] font-bold tracking-[0.1em] uppercase disabled:opacity-50 dark:bg-white"
          disabled={disabled || isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : submissionId ? (
            <Save aria-hidden="true" size={14} />
          ) : (
            <FolderPlus aria-hidden="true" size={14} />
          )}
          {submissionId ? "Save submission" : "Add submission"}
        </button>
      </div>
    </form>
  );
}
