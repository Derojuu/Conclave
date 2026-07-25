"use client";

import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type OrganizationLogoFormProps = {
  organizationId: string;
  organizationName: string;
  logo: string | null;
};

export function OrganizationLogoForm({
  organizationId,
  organizationName,
  logo,
}: OrganizationLogoFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadLogo(file: File) {
    setIsPending(true);
    setMessage(null);
    const body = new FormData();
    body.set("logo", file);
    const response = await fetch(
      `/api/organizations/${organizationId}/logo`,
      {
        method: "POST",
        body,
      },
    );
    const result = (await response.json()) as { error?: string };

    setIsPending(false);
    if (!response.ok) {
      setMessage(result.error ?? "Logo upload failed.");
      return;
    }

    setMessage("Logo updated.");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    router.refresh();
  }

  async function removeLogo() {
    setIsPending(true);
    setMessage(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/logo`,
      { method: "DELETE" },
    );
    const result = (await response.json()) as { error?: string };

    setIsPending(false);
    if (!response.ok) {
      setMessage(result.error ?? "Logo removal failed.");
      return;
    }

    setMessage("Logo removed.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-black/[0.08] bg-black/[0.02] text-xl font-bold text-indigo-500 dark:border-white/[0.08] dark:bg-white/[0.02]">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${organizationName} logo`}
            className="h-full w-full object-cover"
            src={logo}
          />
        ) : (
          organizationName.slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-zinc-950 dark:text-white">
          Organization logo
        </p>
        <p className="mt-2 text-[9px] leading-5 text-zinc-500">
          Upload a PNG, JPEG, or WebP image up to 2 MB.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-black/[0.08] px-4 text-[8px] font-bold tracking-[0.08em] uppercase transition-colors hover:border-indigo-500 dark:border-white/[0.08]">
            {isPending ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={13} />
            ) : (
              <ImageUp aria-hidden="true" size={13} />
            )}
            Upload logo
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadLogo(file);
                }
              }}
              ref={inputRef}
              type="file"
            />
          </label>
          {logo ? (
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-rose-500/20 px-4 text-[8px] font-bold tracking-[0.08em] text-rose-500 uppercase"
              disabled={isPending}
              onClick={removeLogo}
              type="button"
            >
              <Trash2 aria-hidden="true" size={13} />
              Remove
            </button>
          ) : null}
        </div>
        {message ? (
          <p
            className={
              message === "Logo updated." || message === "Logo removed."
                ? "mt-3 text-[9px] text-emerald-500"
                : "mt-3 text-[9px] text-rose-500"
            }
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
