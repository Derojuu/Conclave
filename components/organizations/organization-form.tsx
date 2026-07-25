"use client";

import { Building2, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  organizationSchema,
  type OrganizationInput,
} from "@/lib/validation/auth";
import { generateOrganizationSlug } from "@/utils/organization";

type OrganizationFormProps = {
  organizationId?: string;
  defaultValues?: OrganizationInput;
};

export function OrganizationForm({
  organizationId,
  defaultValues,
}: OrganizationFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(organizationId));
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationInput>({
    defaultValues: defaultValues ?? {
      name: "",
      slug: "",
      description: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const parsed = organizationSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (
          field === "name" ||
          field === "slug" ||
          field === "description"
        ) {
          setError(field, { message: issue.message });
        }
      });
      return;
    }

    const response = await fetch(
      organizationId
        ? `/api/organizations/${organizationId}`
        : "/api/organizations",
      {
      method: organizationId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      },
    );
    const result = (await response.json()) as {
      error?: string;
      organization?: { id: string };
    };

    if (!response.ok || !result.organization) {
      setMessage(
        result.error ??
          `Organization ${organizationId ? "update" : "creation"} failed.`,
      );
      return;
    }

    if (organizationId) {
      setMessage("Organization profile updated.");
      router.refresh();
      return;
    }

    router.push(`/organizations/${result.organization.id}`);
    router.refresh();
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label
          className="text-[8px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
          htmlFor="name"
        >
          Organization name
        </label>
        <input
          className="mt-2 h-11 w-full rounded-sm border border-black/[0.08] bg-black/[0.02] px-3 text-[11px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
          id="name"
          {...register("name", {
            onChange(event) {
              if (!slugWasEdited) {
                setValue(
                  "slug",
                  generateOrganizationSlug(String(event.target.value)),
                  { shouldValidate: true },
                );
              }
            },
          })}
        />
        {errors.name ? (
          <p className="mt-2 text-[9px] text-rose-500">{errors.name.message}</p>
        ) : null}
      </div>

      <div>
        <label
          className="text-[8px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
          htmlFor="slug"
        >
          Workspace slug
        </label>
        <input
          className="mt-2 h-11 w-full rounded-sm border border-black/[0.08] bg-black/[0.02] px-3 text-[11px] outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
          id="slug"
          {...register("slug", {
            onChange() {
              setSlugWasEdited(true);
            },
          })}
        />
        {errors.slug ? (
          <p className="mt-2 text-[9px] text-rose-500">{errors.slug.message}</p>
        ) : null}
      </div>

      <div>
        <label
          className="text-[8px] font-bold tracking-[0.12em] text-zinc-500 uppercase"
          htmlFor="description"
        >
          Description
        </label>
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-sm border border-black/[0.08] bg-black/[0.02] p-3 text-[11px] leading-5 outline-none focus:border-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]"
          id="description"
          {...register("description")}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
        <p
          className={
            message === "Organization profile updated."
              ? "text-[9px] text-emerald-500"
              : "text-[9px] text-rose-500"
          }
          role="status"
        >
          {message}
        </p>
        <button
          className="button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-zinc-950 px-5 py-3 text-[9px] font-bold tracking-[0.1em] uppercase disabled:opacity-60 dark:bg-white"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={14} />
          ) : organizationId ? (
            <Save aria-hidden="true" size={14} />
          ) : (
            <Building2 aria-hidden="true" size={14} />
          )}
          {organizationId ? "Save organization" : "Create organization"}
        </button>
      </div>
    </form>
  );
}
