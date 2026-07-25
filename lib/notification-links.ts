type NotificationLinkInput = {
  type: "INVITATION" | "CAMPAIGN" | "EVALUATION" | "RESULT" | "SYSTEM";
  data: unknown;
};

function recordValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

export function getNotificationHref({
  type,
  data,
}: NotificationLinkInput) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return type === "SYSTEM" ? "/account" : "/dashboard";
  }

  const record = data as Record<string, unknown>;
  const organizationId = recordValue(record, "organizationId");
  const campaignId = recordValue(record, "campaignId");
  const submissionId = recordValue(record, "submissionId");

  if (organizationId && campaignId && submissionId && type === "EVALUATION") {
    return `/organizations/${organizationId}/campaigns/${campaignId}/submissions/${submissionId}/evaluate`;
  }
  if (organizationId && campaignId && type === "RESULT") {
    return `/organizations/${organizationId}/campaigns/${campaignId}/results`;
  }
  if (organizationId && campaignId) {
    return `/organizations/${organizationId}/campaigns/${campaignId}`;
  }
  if (organizationId && type !== "INVITATION") {
    return `/organizations/${organizationId}`;
  }

  return type === "SYSTEM" ? "/account" : "/dashboard";
}
