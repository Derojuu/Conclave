"use client";

import { Loader2, Save, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { campaignSchema } from "@/lib/validation/campaign";

type TemplateOption = {
  id: string;
  title: string;
  version: number;
};

type CampaignFormValues = {
  title: string;
  description: string;
  deadline: string;
  evaluationTemplateId: string;
};

type CampaignFormProps = {
  organizationId: string;
  campaignId?: string;
  templates: TemplateOption[];
  defaultValues?: {
    title: string;
    description: string;
    deadline: string | null;
    evaluationTemplateId: string | null;
  };
  disabled?: boolean;
};

function toLocalDateTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function CampaignForm({
  organizationId,
  campaignId,
  templates,
  defaultValues,
  disabled = false,
}: CampaignFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      deadline: toLocalDateTime(defaultValues?.deadline),
      evaluationTemplateId:
        defaultValues?.evaluationTemplateId ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const payload = {
      title: values.title,
      description: values.description,
      deadline: values.deadline
        ? new Date(values.deadline).toISOString()
        : null,
      evaluationTemplateId: values.evaluationTemplateId || null,
    };
    const parsed = campaignSchema.safeParse(payload);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (
          field === "title" ||
          field === "description" ||
          field === "deadline" ||
          field === "evaluationTemplateId"
        ) {
          setError(field, { message: issue.message });
        }
      });
      return;
    }

    const response = await fetch(
      campaignId
        ? `/api/organizations/${organizationId}/campaigns/${campaignId}`
        : `/api/organizations/${organizationId}/campaigns`,
      {
        method: campaignId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      },
    );
    const result = (await response.json()) as {
      error?: string;
      campaign?: { id: string };
    };

    if (!response.ok || !result.campaign) {
      setMessage(result.error ?? "Campaign could not be saved.");
      return;
    }

    if (campaignId) {
      setMessage("Campaign settings saved.");
      router.refresh();
      return;
    }

    router.push(
      `/organizations/${organizationId}/campaigns/${result.campaign.id}`,
    );
    router.refresh();
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label
          className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
          htmlFor="campaign-title"
        >
          Campaign title
        </label>
        <input
          className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[13px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
          id="campaign-title"
          disabled={disabled}
          {...register("title")}
        />
        {errors.title ? (
          <p className="mt-2 text-[11px] text-rose-500" role="alert">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
          htmlFor="campaign-description"
        >
          Description
        </label>
        <textarea
          className="mt-2 min-h-32 w-full resize-y border border-black/[0.08] bg-black/[0.02] p-3 text-[13px] leading-6 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
          id="campaign-description"
          disabled={disabled}
          {...register("description")}
        />
        {errors.description ? (
          <p className="mt-2 text-[11px] text-rose-500" role="alert">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
            htmlFor="campaign-deadline"
          >
            Deadline
          </label>
          <input
            className="mt-2 h-11 w-full border border-black/[0.08] bg-black/[0.02] px-3 text-[12px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
            id="campaign-deadline"
            disabled={disabled}
            type="datetime-local"
            {...register("deadline")}
          />
        </div>
        <div>
          <label
            className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
            htmlFor="evaluation-template"
          >
            Evaluation template
          </label>
          <select
            className="mt-2 h-11 w-full border border-black/[0.08] bg-[#EBE8E1] px-3 text-[12px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-[#111]"
            id="evaluation-template"
            disabled={disabled}
            {...register("evaluationTemplateId")}
          >
            <option value="">No template selected</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title} / v{template.version}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <p
          className={
            message === "Campaign settings saved."
              ? "text-[11px] text-emerald-500"
              : "text-[11px] text-rose-500"
          }
          role="status"
        >
          {message}
        </p>
        <button
          className="button-primary inline-flex min-h-11 items-center justify-center gap-2 bg-zinc-950 px-5 py-3 text-[11px] font-bold tracking-[0.1em] uppercase disabled:opacity-60 dark:bg-white"
          disabled={disabled || isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : campaignId ? (
            <Save aria-hidden="true" size={14} />
          ) : (
            <Scale aria-hidden="true" size={14} />
          )}
          {campaignId ? "Save campaign" : "Create campaign"}
        </button>
      </div>
    </form>
  );
}
