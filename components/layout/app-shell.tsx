import {
  Bell,
  LayoutDashboard,
  ClipboardCheck,
  Plus,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { OrganizationSidebarLink } from "@/components/organizations/organization-sidebar-link";
import { OrganizationSwitcher } from "@/components/organizations/organization-switcher";
import { BrandMark } from "@/components/ui/brand-mark";
import type { AuthorizationContext } from "@/lib/security/rbac";

type AppShellProps = {
  user: {
    fullName: string;
    email: string;
    avatar: string | null;
    platformRole: "USER" | "SUPER_ADMIN";
  };
  authorization: AuthorizationContext;
  activeOrganizationId: string | null;
  children: React.ReactNode;
  unreadNotificationCount: number;
};

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/evaluations", label: "Evaluations", icon: ClipboardCheck },
  { href: "/account", label: "Account", icon: Settings },
] as const;

export function AppShell({
  user,
  authorization,
  activeOrganizationId,
  children,
  unreadNotificationCount,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F2EB] dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#F5F2EB]/90 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#0a0a0a]/90">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link className="flex items-center gap-3" href="/dashboard">
              <BrandMark />
              <span className="hidden text-sm font-bold sm:inline">
                Conclave
              </span>
            </Link>
            <OrganizationSwitcher
              activeOrganizationId={activeOrganizationId}
              organizations={authorization.organizations}
            />
            <nav
              aria-label="Primary navigation"
              className="hidden items-center gap-1 md:flex"
            >
              {navigation.map((item) => (
                <Link
                  className="flex h-9 items-center gap-2 rounded-sm px-3 text-[9px] font-bold tracking-[0.1em] text-zinc-500 uppercase transition-colors hover:bg-black/[0.04] hover:text-zinc-950 dark:hover:bg-white/[0.04] dark:hover:text-white"
                  href={item.href}
                  key={item.href}
                >
                  <item.icon aria-hidden="true" size={14} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              aria-label={`${unreadNotificationCount} unread notifications`}
              className="relative flex h-10 w-10 items-center justify-center border border-black/[0.07] text-zinc-500 transition-colors hover:border-indigo-500 hover:text-indigo-500 dark:border-white/[0.07]"
              href="/notifications"
            >
              <Bell aria-hidden="true" size={15} />
              {unreadNotificationCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 flex min-h-3.5 min-w-3.5 items-center justify-center bg-indigo-500 px-1 text-[6px] font-bold text-white">
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              ) : null}
            </Link>
            <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-sm border border-black/[0.07] px-3 py-2 dark:border-white/[0.07]">
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-sm bg-indigo-500/10 text-[9px] font-bold text-indigo-500">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={user.avatar}
                  />
                ) : (
                  user.fullName.slice(0, 2).toUpperCase()
                )}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-40 truncate text-[9px] font-bold text-zinc-950 dark:text-white">
                  {user.fullName}
                </span>
                <span className="mt-0.5 block max-w-40 truncate text-[7px] text-zinc-500">
                  {user.email}
                </span>
              </span>
            </summary>
            <div className="absolute top-12 right-0 w-64 overflow-hidden rounded-sm border border-black/[0.08] bg-[#EBE8E1] shadow-2xl dark:border-white/[0.08] dark:bg-[#111]">
              <div className="border-b border-black/[0.06] px-4 py-4 dark:border-white/[0.06]">
                <p className="truncate text-[10px] font-bold text-zinc-950 dark:text-white">
                  {user.fullName}
                </p>
                <p className="mt-1 truncate text-[8px] text-zinc-500">
                  {user.email}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[7px] font-bold tracking-[0.1em] text-emerald-500 uppercase">
                  <ShieldCheck aria-hidden="true" size={12} />
                  {user.platformRole === "SUPER_ADMIN"
                    ? "Super admin"
                    : "Authenticated"}
                </div>
              </div>
              <Link
                className="flex items-center gap-3 px-4 py-3 text-[9px] font-bold tracking-[0.08em] text-zinc-600 uppercase hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.04]"
                href="/account"
              >
                <UserRound aria-hidden="true" size={14} />
                Account settings
              </Link>
              <Link
                className="flex items-center gap-3 border-t border-black/[0.06] px-4 py-3 text-[9px] font-bold tracking-[0.08em] text-zinc-600 uppercase hover:bg-black/[0.04] dark:border-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.04]"
                href="/notifications"
              >
                <Bell aria-hidden="true" size={14} />
                Notifications
              </Link>
              {user.platformRole === "SUPER_ADMIN" ? (
                <Link
                  className="flex items-center gap-3 border-t border-black/[0.06] px-4 py-3 text-[9px] font-bold tracking-[0.08em] text-emerald-600 uppercase hover:bg-emerald-500/[0.05] dark:border-white/[0.06] dark:text-emerald-400"
                  href="/admin"
                >
                  <ShieldCheck aria-hidden="true" size={14} />
                  Platform admin
                </Link>
              ) : null}
              <form action={signOutAction}>
                <button
                  className="flex w-full items-center gap-3 border-t border-black/[0.06] px-4 py-3 text-left text-[9px] font-bold tracking-[0.08em] text-rose-500 uppercase hover:bg-rose-500/[0.05] dark:border-white/[0.06]"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
            </details>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[240px_1fr]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-black/[0.06] p-5 lg:block dark:border-white/[0.06]">
          <p className="px-2 text-[8px] font-bold tracking-[0.16em] text-zinc-500 uppercase">
            Organizations
          </p>
          <div className="mt-4 space-y-1">
            {authorization.organizations.map((organization) => (
              <OrganizationSidebarLink
                active={organization.id === activeOrganizationId}
                key={organization.id}
                organization={organization}
              />
            ))}
            <Link
              className="flex items-center gap-3 rounded-sm px-2 py-3 text-[9px] font-bold tracking-[0.08em] text-indigo-500 uppercase transition-colors hover:bg-indigo-500/[0.06]"
              href="/organizations/new"
            >
              <Plus aria-hidden="true" size={14} />
              New organization
            </Link>
          </div>
        </aside>

        <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
