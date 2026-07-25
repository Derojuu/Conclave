import { LayoutDashboard, Paperclip, Settings, Users } from "lucide-react";
import Link from "next/link";

type SubmissionNavigationProps = {
  organizationId: string;
  campaignId: string;
  submissionId: string;
  canManage: boolean;
};

export function SubmissionNavigation({
  organizationId,
  campaignId,
  submissionId,
  canManage,
}: SubmissionNavigationProps) {
  const base = `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}`;
  const links = [
    { href: base, label: "Overview", icon: LayoutDashboard },
    { href: `${base}/attachments`, label: "Attachments", icon: Paperclip },
    { href: `${base}/contributors`, label: "Contributors", icon: Users },
    ...(canManage
      ? [{ href: `${base}/settings`, label: "Settings", icon: Settings }]
      : []),
  ];

  return (
    <nav
      aria-label="Submission navigation"
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
