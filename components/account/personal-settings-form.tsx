"use client";

import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  personalSettingsSchema,
  type PersonalSettingsInput,
} from "@/lib/validation/auth";

type PersonalSettingsFormProps = {
  defaultValues: PersonalSettingsInput;
};

const options = [
  {
    name: "decisionNotifications" as const,
    label: "Decision activity",
    description:
      "Receive updates about campaigns, evaluations, and published results.",
  },
  {
    name: "securityNotifications" as const,
    label: "Security activity",
    description:
      "Receive important notices about sign-ins and wallet changes.",
  },
  {
    name: "emailNotifications" as const,
    label: "Email delivery",
    description:
      "Allow Conclave to deliver enabled notifications to your Google email.",
  },
] as const;

export function PersonalSettingsForm({
  defaultValues,
}: PersonalSettingsFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PersonalSettingsInput>({ defaultValues });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const parsed = personalSettingsSchema.safeParse(values);

    if (!parsed.success) {
      setMessage("Review your notification settings.");
      return;
    }

    const response = await fetch("/api/account/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const result = (await response.json()) as { error?: string };

    setMessage(
      response.ok
        ? "Preferences saved."
        : (result.error ?? "Preferences could not be saved."),
    );
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {options.map((option) => (
        <label
          className="flex cursor-pointer items-start justify-between gap-5 border-b border-black/[0.06] pb-5 last:border-0 last:pb-0 dark:border-white/[0.06]"
          key={option.name}
        >
          <span>
            <span className="block text-[12px] font-bold text-zinc-950 dark:text-white">
              {option.label}
            </span>
            <span className="mt-1 block max-w-xl text-[11px] leading-5 text-zinc-500">
              {option.description}
            </span>
          </span>
          <input
            className="mt-1 h-4 w-4 shrink-0 accent-indigo-500"
            type="checkbox"
            {...register(option.name)}
          />
        </label>
      ))}

      <div className="flex flex-col gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <p
          className={
            message === "Preferences saved."
              ? "text-[11px] text-emerald-500"
              : "text-[11px] text-rose-500"
          }
          role="status"
        >
          {message}
        </p>
        <button
          className="button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-zinc-950 px-5 py-3 text-[11px] font-bold tracking-[0.1em] uppercase disabled:cursor-wait disabled:opacity-60 dark:bg-white"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : (
            <Save aria-hidden="true" size={14} />
          )}
          Save preferences
        </button>
      </div>
    </form>
  );
}
