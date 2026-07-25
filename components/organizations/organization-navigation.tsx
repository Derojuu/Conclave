import {
  ClipboardList,
  History,
  LayoutDashboard,
  Scale,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";

type OrganizationNavigationProps = {
  organizationId: string;
  canManageSettings: boolean;
  canReadAudit: boolean;
};

export function OrganizationNavigation({
  organizationId,
  canManageSettings,
  canReadAudit,
}: OrganizationNavigationProps) {
  const links = [
    {
      href: `/organizations/${organizationId}`,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: `/organizations/${organizationId}/campaigns`,
      label: "Campaigns",
      icon: Scale,
    },
    {
      href: `/organizations/${organizationId}/evaluation-templates`,
      label: "Templates",
      icon: ClipboardList,
    },
    {
      href: `/organizations/${organizationId}/members`,
      label: "Members",
      icon: Users,
    },
    ...(canReadAudit
      ? [
          {
            href: `/organizations/${organizationId}/audit-logs`,
            label: "Audit",
            icon: History,
          },
        ]
      : []),
    ...(canManageSettings
      ? [
          {
            href: `/organizations/${organizationId}/settings`,
            label: "Settings",
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label="Organization navigation"
      className="mt-7 flex flex-wrap gap-2 border-b border-black/[0.06] pb-4 dark:border-white/[0.06]"
    >
      {links.map((link) => (
        <Link
          className="inline-flex min-h-9 items-center gap-2 border border-black/[0.06] px-3 text-[8px] font-bold tracking-[0.08em] text-zinc-500 uppercase transition-colors hover:border-indigo-500 hover:text-indigo-500 dark:border-white/[0.06]"
          href={link.href}
          key={link.href}
        >
          <link.icon aria-hidden="true" size={12} />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
