"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  profileSchema,
  type ProfileInput,
} from "@/lib/validation/auth";

type ProfileFormProps = {
  defaultValues: ProfileInput;
  email: string;
};

export function ProfileForm({ defaultValues, email }: ProfileFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ defaultValues });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const parsed = profileSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "fullName" || field === "avatar") {
          setError(field, { message: issue.message });
        }
      });
      return;
    }

    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const result = (await response.json()) as {
      error?: string;
    };

    if (!response.ok) {
      setMessage(result.error ?? "Profile update failed.");
      return;
    }

    setMessage("Profile updated.");
    router.refresh();
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label
          className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
          htmlFor="fullName"
        >
          Full name
        </label>
        <input
          className="mt-2 h-11 w-full rounded-sm border border-black/[0.08] bg-black/[0.02] px-3 text-[13px] text-zinc-950 outline-none transition-colors focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white"
          id="fullName"
          {...register("fullName")}
        />
        {errors.fullName ? (
          <p className="mt-2 text-[11px] text-rose-500" role="alert">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
          htmlFor="email"
        >
          Google account
        </label>
        <input
          className="mt-2 h-11 w-full cursor-not-allowed rounded-sm border border-black/[0.06] bg-black/[0.025] px-3 text-[13px] text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.025]"
          disabled
          id="email"
          value={email}
        />
      </div>

      <div>
        <label
          className="text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
          htmlFor="avatar"
        >
          Avatar URL
        </label>
        <input
          className="mt-2 h-11 w-full rounded-sm border border-black/[0.08] bg-black/[0.02] px-3 text-[13px] text-zinc-950 outline-none transition-colors focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white"
          id="avatar"
          placeholder="https://"
          {...register("avatar")}
        />
        {errors.avatar ? (
          <p className="mt-2 text-[11px] text-rose-500" role="alert">
            {errors.avatar.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <p
          className={
            message === "Profile updated."
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
          Save profile
        </button>
      </div>
    </form>
  );
}
