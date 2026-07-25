import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInvitationButton } from "@/components/invitations/accept-invitation-button";
import { requireAuthenticatedUser } from "@/lib/auth";
import { hashInvitationToken } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Organization invitation",
  robots: { index: false, follow: false },
};

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await requireAuthenticatedUser({
    next: `/invitations/${token}`,
  });
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: {
      organization: {
        select: { name: true, logo: true },
      },
    },
  });

  const invalid =
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt <= new Date();
  const emailMismatch =
    invitation && invitation.email.toLowerCase() !== user.email.toLowerCase();

  return (
    <AuthShell>
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 bg-emerald-500" />
          <p className="text-[11px] font-bold tracking-[0.18em] text-zinc-500 uppercase">
            Organization invitation
          </p>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-zinc-950 uppercase dark:text-white">
          {invitation?.organization.name ?? "Invitation unavailable"}
        </h1>

        {invalid ? (
          <p className="mt-5 text-[12px] leading-6 text-rose-500">
            This invitation is invalid, expired, revoked, or already accepted.
          </p>
        ) : emailMismatch ? (
          <p className="mt-5 text-[12px] leading-6 text-rose-500">
            This invitation was issued to {invitation.email}. Sign in with that
            Google account to accept it.
          </p>
        ) : (
          <>
            <p className="mt-5 text-[12px] leading-6 text-zinc-500">
              You were invited to join as{" "}
              <strong className="text-zinc-950 dark:text-white">
                {invitation.role}
              </strong>
              . Your authenticated email matches the invitation.
            </p>
            <div className="mt-8">
              <AcceptInvitationButton token={token} />
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
