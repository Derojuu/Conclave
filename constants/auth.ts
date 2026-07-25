export const PLATFORM_ROLES = {
  user: "USER",
  superAdmin: "SUPER_ADMIN",
} as const;

export const ORGANIZATION_ROLES = {
  owner: "OWNER",
  admin: "ADMIN",
  evaluator: "EVALUATOR",
  observer: "OBSERVER",
} as const;

export const ORGANIZATION_PERMISSIONS = {
  read: "organization.read",
  update: "organization.update",
  delete: "organization.delete",
  membersRead: "members.read",
  membersManage: "members.manage",
  invitationsManage: "invitations.manage",
  campaignsRead: "campaigns.read",
  campaignsManage: "campaigns.manage",
  templatesRead: "templates.read",
  templatesManage: "templates.manage",
  submissionsRead: "submissions.read",
  submissionsManage: "submissions.manage",
  evaluationsSubmit: "evaluations.submit",
  resultsRead: "results.read",
  resultsPublish: "results.publish",
  auditLogsRead: "audit-logs.read",
} as const;

export type OrganizationRole =
  (typeof ORGANIZATION_ROLES)[keyof typeof ORGANIZATION_ROLES];
export type OrganizationPermission =
  (typeof ORGANIZATION_PERMISSIONS)[keyof typeof ORGANIZATION_PERMISSIONS];

export const assignableOrganizationRoles = [
  ORGANIZATION_ROLES.admin,
  ORGANIZATION_ROLES.evaluator,
  ORGANIZATION_ROLES.observer,
] as const;

export const rolePermissions: Record<
  OrganizationRole,
  readonly OrganizationPermission[]
> = {
  OWNER: Object.values(ORGANIZATION_PERMISSIONS),
  ADMIN: [
    ORGANIZATION_PERMISSIONS.read,
    ORGANIZATION_PERMISSIONS.update,
    ORGANIZATION_PERMISSIONS.membersRead,
    ORGANIZATION_PERMISSIONS.membersManage,
    ORGANIZATION_PERMISSIONS.invitationsManage,
    ORGANIZATION_PERMISSIONS.campaignsRead,
    ORGANIZATION_PERMISSIONS.campaignsManage,
    ORGANIZATION_PERMISSIONS.templatesRead,
    ORGANIZATION_PERMISSIONS.templatesManage,
    ORGANIZATION_PERMISSIONS.submissionsRead,
    ORGANIZATION_PERMISSIONS.submissionsManage,
    ORGANIZATION_PERMISSIONS.resultsRead,
    ORGANIZATION_PERMISSIONS.resultsPublish,
    ORGANIZATION_PERMISSIONS.auditLogsRead,
  ],
  EVALUATOR: [
    ORGANIZATION_PERMISSIONS.read,
    ORGANIZATION_PERMISSIONS.membersRead,
    ORGANIZATION_PERMISSIONS.campaignsRead,
    ORGANIZATION_PERMISSIONS.templatesRead,
    ORGANIZATION_PERMISSIONS.submissionsRead,
    ORGANIZATION_PERMISSIONS.evaluationsSubmit,
    ORGANIZATION_PERMISSIONS.resultsRead,
  ],
  OBSERVER: [
    ORGANIZATION_PERMISSIONS.read,
    ORGANIZATION_PERMISSIONS.membersRead,
    ORGANIZATION_PERMISSIONS.campaignsRead,
    ORGANIZATION_PERMISSIONS.templatesRead,
    ORGANIZATION_PERMISSIONS.submissionsRead,
    ORGANIZATION_PERMISSIONS.resultsRead,
  ],
};

export function roleHasPermission(
  role: OrganizationRole,
  permission: OrganizationPermission,
) {
  return rolePermissions[role].includes(permission);
}
