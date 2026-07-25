import { AppShell } from "@/components/layout/app-shell";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthorizationContext } from "@/lib/security/rbac";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthenticatedUser();
  const [authorization, settings, unreadNotificationCount] = await Promise.all([
    getAuthorizationContext(user.id),
    prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { activeOrganizationId: true },
    }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);
  const activeOrganizationId =
    authorization.organizations.find(
      (organization) =>
        organization.id === settings?.activeOrganizationId,
    )?.id ??
    authorization.organizations[0]?.id ??
    null;

  return (
    <AppShell
      activeOrganizationId={activeOrganizationId}
      authorization={authorization}
      unreadNotificationCount={unreadNotificationCount}
      user={user}
    >
      {children}
    </AppShell>
  );
}
