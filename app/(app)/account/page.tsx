import type { Metadata } from "next";

import { MembershipPanel } from "@/components/account/membership-panel";
import { PersonalSettingsForm } from "@/components/account/personal-settings-form";
import { ProfileForm } from "@/components/account/profile-form";
import { SecurityPanel } from "@/components/account/security-panel";
import { WalletLinkCard } from "@/components/account/wallet-link-card";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthorizationContext } from "@/lib/security/rbac";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireAuthenticatedUser();
  const [authorization, account] = await Promise.all([
    getAuthorizationContext(user.id),
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        settings: true,
        auditLogs: {
          where: { action: "SIGN_IN" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ]);
  const settings = account.settings ?? {
    emailNotifications: true,
    securityNotifications: true,
    decisionNotifications: true,
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 bg-emerald-500" />
        <p className="text-[10px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
          Identity and account
        </p>
      </div>
      <h1 className="mt-5 text-3xl font-bold text-zinc-950 uppercase sm:text-4xl dark:text-white">
        Account settings
      </h1>
      <p className="mt-4 max-w-2xl text-[13px] leading-6 text-zinc-500">
        Manage your Conclave profile and optional blockchain identity.
      </p>

      <section className="mt-10 border-y border-black/[0.06] py-8 dark:border-white/[0.06]">
        <div className="mb-7">
          <p className="text-[12px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
            Profile information
          </p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">
            Your email is managed by your authenticated Google account.
          </p>
        </div>
        <ProfileForm
          defaultValues={{
            fullName: user.fullName,
            avatar: user.avatar ?? "",
          }}
          email={user.email}
        />
      </section>

      <section className="py-8">
        <WalletLinkCard linkedAddress={user.walletAddress} />
      </section>

      <section className="border-t border-black/[0.06] py-8 dark:border-white/[0.06]">
        <div className="mb-7">
          <p className="text-[12px] font-bold tracking-[0.08em] text-zinc-950 uppercase dark:text-white">
            Personal settings
          </p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">
            Choose which account and decision events Conclave should deliver.
          </p>
        </div>
        <PersonalSettingsForm
          defaultValues={{
            emailNotifications: settings.emailNotifications,
            securityNotifications: settings.securityNotifications,
            decisionNotifications: settings.decisionNotifications,
          }}
        />
      </section>

      <section className="border-t border-black/[0.06] py-8 dark:border-white/[0.06]">
        <MembershipPanel authorization={authorization} />
      </section>

      <section className="border-t border-black/[0.06] py-8 dark:border-white/[0.06]">
        <SecurityPanel
          isSuperAdmin={authorization.isSuperAdmin}
          lastSignInAt={account.auditLogs[0]?.createdAt ?? null}
        />
      </section>
    </div>
  );
}
