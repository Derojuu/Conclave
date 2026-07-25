"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  FilePlus2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type FieldPath,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import type { ZodError } from "zod";

import { EvaluationTemplatePreview } from "@/components/evaluation-templates/evaluation-template-preview";
import {
  EVALUATION_SCORE_TYPES,
  evaluationScoreTypeDefaults,
  evaluationScoreTypeLabels,
  type EvaluationScoreType,
} from "@/constants/evaluation-template";
import {
  evaluationTemplateSchema,
  type EvaluationTemplateInput,
} from "@/lib/validation/evaluation-template";

type BuilderFormValues = Omit<EvaluationTemplateInput, "deadline"> & {
  deadline: string;
};

type EvaluationTemplateBuilderProps = {
  organizationId: string;
  templateId?: string;
  version?: number;
  editable: boolean;
  defaultValues?: EvaluationTemplateInput;
};

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "invalid" | "error";

function toLocalDateTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toPayload(values: BuilderFormValues): EvaluationTemplateInput {
  return {
    ...values,
    deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
  };
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

const emptyCriterion: BuilderFormValues["criteria"][number] = {
  label: "",
  description: "",
  type: "NUMERIC",
  weight: 1,
  minScore: 0,
  maxScore: 10,
};

export function EvaluationTemplateBuilder({
  organizationId,
  templateId,
  version,
  editable,
  defaultValues,
}: EvaluationTemplateBuilderProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"builder" | "preview">("builder");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const latestSaveRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const {
    control,
    register,
    getValues,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<BuilderFormValues>({
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      instructions: defaultValues?.instructions ?? "",
      deadline: toLocalDateTime(defaultValues?.deadline),
      isDefault: defaultValues?.isDefault ?? false,
      criteria: defaultValues?.criteria ?? [emptyCriterion],
    },
  });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "criteria",
  });
  const watchedValues = useWatch({ control }) as BuilderFormValues;

  const applyValidationErrors = useCallback(
    (error: ZodError<EvaluationTemplateInput>) => {
      clearErrors();

      error.issues.forEach((issue) => {
        const path = issue.path.join(".") as FieldPath<BuilderFormValues>;
        setError(path, {
          type: "validate",
          message: issue.message,
        });
      });
    },
    [clearErrors, setError],
  );

  const persist = useCallback(
    async (values: BuilderFormValues, sequence: number) => {
      const parsed = evaluationTemplateSchema.safeParse(toPayload(values));

      if (!parsed.success) {
        if (sequence === latestSaveRef.current) {
          applyValidationErrors(parsed.error);
          setSaveStatus("invalid");
          setMessage("Resolve the highlighted fields before saving.");
        }
        return;
      }

      if (sequence === latestSaveRef.current) {
        clearErrors();
        setSaveStatus("saving");
        setMessage(null);
      }

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/evaluation-templates/${templateId}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(parsed.data),
          },
        );
        const result = (await response.json()) as {
          error?: string;
          template?: { id: string };
        };

        if (!response.ok || !result.template) {
          if (sequence === latestSaveRef.current) {
            setSaveStatus("error");
            setMessage(result.error ?? "Template could not be saved.");
          }
          return;
        }

        if (sequence === latestSaveRef.current) {
          setSaveStatus("saved");
          setLastSaved(
            new Intl.DateTimeFormat("en", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            }).format(new Date()),
          );
        }
      } catch {
        if (sequence === latestSaveRef.current) {
          setSaveStatus("error");
          setMessage("The template service is currently unavailable.");
        }
      }
    },
    [applyValidationErrors, clearErrors, organizationId, templateId],
  );

  const createInitialTemplate = useCallback(
    async (values: BuilderFormValues) => {
      const parsed = evaluationTemplateSchema.safeParse(toPayload(values));

      if (!parsed.success) {
        applyValidationErrors(parsed.error);
        setSaveStatus("invalid");
        setMessage("Resolve the highlighted fields before saving.");
        return;
      }

      clearErrors();
      setSaveStatus("saving");
      setMessage(null);

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/evaluation-templates`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(parsed.data),
          },
        );
        const result = (await response.json()) as {
          error?: string;
          template?: { id: string };
        };

        if (!response.ok || !result.template) {
          setSaveStatus("error");
          setMessage(result.error ?? "Template could not be created.");
          return;
        }

        router.push(
          `/organizations/${organizationId}/evaluation-templates/${result.template.id}`,
        );
        router.refresh();
      } catch {
        setSaveStatus("error");
        setMessage("The template service is currently unavailable.");
      }
    },
    [applyValidationErrors, clearErrors, organizationId, router],
  );

  const enqueueSave = useCallback(
    (values: BuilderFormValues) => {
      const sequence = ++latestSaveRef.current;
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (sequence < latestSaveRef.current) {
            return;
          }

          await persist(values, sequence);
        });
    },
    [persist],
  );

  const scheduleAutosave = useCallback(() => {
    if (!templateId || !editable) {
      return;
    }

    setSaveStatus("dirty");
    setMessage(null);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      enqueueSave(getValues());
    }, 900);
  }, [editable, enqueueSave, getValues, templateId]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  function saveNow() {
    if (!templateId || !editable) {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    enqueueSave(getValues());
  }

  const submitCreate = handleSubmit(createInitialTemplate);

  function updateScoreType(index: number, type: EvaluationScoreType) {
    const defaults = evaluationScoreTypeDefaults[type];
    setValue(`criteria.${index}.type`, type, { shouldDirty: true });
    setValue(`criteria.${index}.minScore`, defaults.minScore, {
      shouldDirty: true,
    });
    setValue(`criteria.${index}.maxScore`, defaults.maxScore, {
      shouldDirty: true,
    });
  }

  function mutateCriteria(operation: () => void) {
    operation();
    window.setTimeout(scheduleAutosave, 0);
  }

  const previewCriteria = (watchedValues.criteria ?? []).map((criterion) => ({
    label: criterion.label ?? "",
    description: criterion.description ?? "",
    type: criterion.type ?? "NUMERIC",
    weight: finiteOr(criterion.weight, 1),
    minScore: finiteOr(criterion.minScore, 0),
    maxScore: finiteOr(criterion.maxScore, 10),
  }));
  const totalWeight = previewCriteria.reduce(
    (total, criterion) => total + criterion.weight,
    0,
  );

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase">
            {templateId
              ? `Template version ${version ?? 1}`
              : "New reusable template"}
          </p>
          <p
            className={
              saveStatus === "error" || saveStatus === "invalid"
                ? "mt-2 text-[11px] text-rose-500"
                : saveStatus === "dirty"
                  ? "mt-2 text-[11px] text-amber-500"
                  : "mt-2 text-[11px] text-zinc-500"
            }
            role="status"
          >
            {!editable && templateId
              ? "This template version is read-only."
              : saveStatus === "saving"
                ? "Saving changes..."
                : saveStatus === "saved"
                  ? `All changes saved${lastSaved ? ` at ${lastSaved}` : ""}.`
                  : saveStatus === "dirty"
                    ? "Unsaved changes."
                    : saveStatus === "invalid"
                      ? "Autosave paused until validation errors are resolved."
                      : (message ??
                        (templateId
                          ? "Changes save automatically."
                          : "Create the template to enable autosave."))}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-black/[0.08] dark:bg-white/[0.08]">
          <button
            className={
              mode === "builder"
                ? "flex min-h-10 items-center justify-center gap-2 bg-zinc-950 px-4 text-[10px] font-bold text-white uppercase dark:bg-white dark:text-black"
                : "flex min-h-10 items-center justify-center gap-2 bg-[#EBE8E1] px-4 text-[10px] font-bold text-zinc-500 uppercase dark:bg-[#111]"
            }
            onClick={() => setMode("builder")}
            type="button"
          >
            <Pencil aria-hidden="true" size={13} />
            Builder
          </button>
          <button
            className={
              mode === "preview"
                ? "flex min-h-10 items-center justify-center gap-2 bg-zinc-950 px-4 text-[10px] font-bold text-white uppercase dark:bg-white dark:text-black"
                : "flex min-h-10 items-center justify-center gap-2 bg-[#EBE8E1] px-4 text-[10px] font-bold text-zinc-500 uppercase dark:bg-[#111]"
            }
            onClick={() => setMode("preview")}
            type="button"
          >
            <Eye aria-hidden="true" size={13} />
            Preview
          </button>
        </div>
      </div>

      {mode === "preview" ? (
        <div className="mt-8">
          <EvaluationTemplatePreview
            criteria={previewCriteria}
            deadline={
              watchedValues.deadline
                ? new Date(watchedValues.deadline).toISOString()
                : null
            }
            description={watchedValues.description ?? ""}
            instructions={watchedValues.instructions ?? ""}
            title={watchedValues.title ?? ""}
          />
        </div>
      ) : (
        <form
          className="mt-8"
          onChange={scheduleAutosave}
          onSubmit={
            templateId ? (event) => event.preventDefault() : submitCreate
          }
        >
          <fieldset disabled={!editable} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
              <div>
                <label
                  className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
                  htmlFor="template-title"
                >
                  Template title
                </label>
                <input
                  className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[13px] outline-none focus:border-indigo-500 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.02]"
                  id="template-title"
                  {...register("title")}
                />
                {errors.title ? (
                  <p className="mt-2 text-[11px] text-rose-500" role="alert">
                    {errors.title.message}
                  </p>
                ) : null}
              </div>
              <label className="mt-5 flex min-h-11 items-center gap-3 border border-black/[0.08] px-3 text-[10px] font-bold tracking-[0.08em] text-zinc-500 uppercase dark:border-white/[0.08]">
                <input
                  className="h-4 w-4 accent-indigo-500"
                  type="checkbox"
                  {...register("isDefault")}
                />
                Organization default
              </label>
            </div>

            <div>
              <label
                className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
                htmlFor="template-description"
              >
                Description
              </label>
              <textarea
                className="mt-2 min-h-24 w-full resize-y border border-black/[0.08] bg-black/[0.02] p-3 text-[12px] leading-5 outline-none focus:border-indigo-500 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.02]"
                id="template-description"
                {...register("description")}
              />
              {errors.description ? (
                <p className="mt-2 text-[11px] text-rose-500" role="alert">
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
                htmlFor="template-instructions"
              >
                Evaluator instructions
              </label>
              <textarea
                className="mt-2 min-h-32 w-full resize-y border border-black/[0.08] bg-black/[0.02] p-3 text-[12px] leading-5 outline-none focus:border-indigo-500 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.02]"
                id="template-instructions"
                {...register("instructions")}
              />
              {errors.instructions ? (
                <p className="mt-2 text-[11px] text-rose-500" role="alert">
                  {errors.instructions.message}
                </p>
              ) : null}
            </div>

            <div className="max-w-sm">
              <label
                className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
                htmlFor="template-deadline"
              >
                Evaluation deadline
              </label>
              <input
                className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[12px] outline-none focus:border-indigo-500 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.02]"
                id="template-deadline"
                type="datetime-local"
                {...register("deadline")}
              />
              {errors.deadline ? (
                <p className="mt-2 text-[11px] text-rose-500" role="alert">
                  {errors.deadline.message}
                </p>
              ) : null}
            </div>

            <div className="border-t border-black/[0.06] pt-8 dark:border-white/[0.06]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[12px] font-bold tracking-[0.1em] text-zinc-950 uppercase dark:text-white">
                    Evaluation criteria
                  </p>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    {fields.length} criteria / total weight{" "}
                    {Number.isFinite(totalWeight)
                      ? totalWeight.toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 border border-black/[0.08] px-4 text-[10px] font-bold tracking-[0.08em] uppercase hover:border-indigo-500 hover:text-indigo-500 dark:border-white/[0.08]"
                  onClick={() =>
                    mutateCriteria(() => append({ ...emptyCriterion }))
                  }
                  type="button"
                >
                  <Plus aria-hidden="true" size={13} />
                  Add criterion
                </button>
              </div>

              {typeof errors.criteria?.message === "string" ? (
                <p className="mt-3 text-[11px] text-rose-500" role="alert">
                  {errors.criteria.message}
                </p>
              ) : null}

              <div className="mt-5 space-y-4">
                {fields.map((field, index) => (
                  <article
                    className="border border-black/[0.07] p-5 dark:border-white/[0.07]"
                    key={field.id}
                  >
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
                      <p className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase">
                        Criterion {index + 1}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          aria-label="Move criterion up"
                          className="flex h-8 w-8 items-center justify-center border border-black/[0.07] text-zinc-500 hover:border-indigo-500 hover:text-indigo-500 disabled:opacity-30 dark:border-white/[0.07]"
                          disabled={index === 0}
                          onClick={() =>
                            mutateCriteria(() => move(index, index - 1))
                          }
                          title="Move criterion up"
                          type="button"
                        >
                          <ArrowUp aria-hidden="true" size={13} />
                        </button>
                        <button
                          aria-label="Move criterion down"
                          className="flex h-8 w-8 items-center justify-center border border-black/[0.07] text-zinc-500 hover:border-indigo-500 hover:text-indigo-500 disabled:opacity-30 dark:border-white/[0.07]"
                          disabled={index === fields.length - 1}
                          onClick={() =>
                            mutateCriteria(() => move(index, index + 1))
                          }
                          title="Move criterion down"
                          type="button"
                        >
                          <ArrowDown aria-hidden="true" size={13} />
                        </button>
                        <button
                          aria-label="Delete criterion"
                          className="flex h-8 w-8 items-center justify-center border border-rose-500/20 text-rose-500 disabled:opacity-30"
                          disabled={fields.length === 1}
                          onClick={() => mutateCriteria(() => remove(index))}
                          title="Delete criterion"
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_180px]">
                      <div>
                        <label
                          className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
                          htmlFor={`criterion-${index}-label`}
                        >
                          Criterion name
                        </label>
                        <input
                          className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[12px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
                          id={`criterion-${index}-label`}
                          {...register(`criteria.${index}.label`)}
                        />
                        {errors.criteria?.[index]?.label ? (
                          <p
                            className="mt-2 text-[11px] text-rose-500"
                            role="alert"
                          >
                            {errors.criteria[index]?.label?.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label
                          className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
                          htmlFor={`criterion-${index}-type`}
                        >
                          Score type
                        </label>
                        <select
                          className="mt-2 h-11 w-full border border-black/[0.08] bg-[#EBE8E1] px-3 text-[12px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#111]"
                          id={`criterion-${index}-type`}
                          onChange={(event) =>
                            updateScoreType(
                              index,
                              event.target.value as EvaluationScoreType,
                            )
                          }
                          value={
                            watchedValues.criteria?.[index]?.type ?? "NUMERIC"
                          }
                        >
                          {EVALUATION_SCORE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {evaluationScoreTypeLabels[type]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label
                        className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
                        htmlFor={`criterion-${index}-description`}
                      >
                        Scoring guidance
                      </label>
                      <textarea
                        className="mt-2 min-h-20 w-full resize-y border border-black/[0.08] bg-black/[0.02] p-3 text-[11px] leading-5 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
                        id={`criterion-${index}-description`}
                        {...register(`criteria.${index}.description`)}
                      />
                      {errors.criteria?.[index]?.description ? (
                        <p
                          className="mt-2 text-[11px] text-rose-500"
                          role="alert"
                        >
                          {errors.criteria[index]?.description?.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-3">
                      <div>
                        <label
                          className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
                          htmlFor={`criterion-${index}-weight`}
                        >
                          Weight
                        </label>
                        <input
                          className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[12px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
                          id={`criterion-${index}-weight`}
                          min="0.01"
                          step="0.01"
                          type="number"
                          {...register(`criteria.${index}.weight`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.criteria?.[index]?.weight ? (
                          <p
                            className="mt-2 text-[11px] text-rose-500"
                            role="alert"
                          >
                            {errors.criteria[index]?.weight?.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label
                          className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
                          htmlFor={`criterion-${index}-minimum`}
                        >
                          Minimum score
                        </label>
                        <input
                          className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[12px] outline-none focus:border-indigo-500 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.02]"
                          disabled={
                            watchedValues.criteria?.[index]?.type ===
                            "PASS_FAIL"
                          }
                          id={`criterion-${index}-minimum`}
                          step="0.1"
                          type="number"
                          {...register(`criteria.${index}.minScore`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.criteria?.[index]?.minScore ? (
                          <p
                            className="mt-2 text-[11px] text-rose-500"
                            role="alert"
                          >
                            {errors.criteria[index]?.minScore?.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label
                          className="text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
                          htmlFor={`criterion-${index}-maximum`}
                        >
                          Maximum score
                        </label>
                        <input
                          className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[12px] outline-none focus:border-indigo-500 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.02]"
                          disabled={
                            watchedValues.criteria?.[index]?.type ===
                            "PASS_FAIL"
                          }
                          id={`criterion-${index}-maximum`}
                          step="0.1"
                          type="number"
                          {...register(`criteria.${index}.maxScore`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.criteria?.[index]?.maxScore ? (
                          <p
                            className="mt-2 text-[11px] text-rose-500"
                            role="alert"
                          >
                            {errors.criteria[index]?.maxScore?.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </fieldset>

          <div className="mt-7 flex flex-col gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
            <p
              className={
                message
                  ? "text-[11px] text-rose-500"
                  : "text-[11px] text-zinc-500"
              }
              role="status"
            >
              {message}
            </p>
            {templateId ? (
              editable ? (
                <button
                  className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[10px] font-bold tracking-[0.1em] uppercase disabled:opacity-50 dark:bg-white"
                  disabled={saveStatus === "saving"}
                  onClick={saveNow}
                  type="button"
                >
                  {saveStatus === "saving" ? (
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin"
                      size={14}
                    />
                  ) : (
                    <Save aria-hidden="true" size={14} />
                  )}
                  Save now
                </button>
              ) : null
            ) : (
              <button
                className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 text-[10px] font-bold tracking-[0.1em] uppercase disabled:opacity-50 dark:bg-white"
                disabled={saveStatus === "saving"}
                type="submit"
              >
                {saveStatus === "saving" ? (
                  <Loader2
                    aria-hidden="true"
                    className="animate-spin"
                    size={14}
                  />
                ) : (
                  <FilePlus2 aria-hidden="true" size={14} />
                )}
                Create template
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
