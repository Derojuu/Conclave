import { z } from "zod";

import { assignableOrganizationRoles } from "@/constants/auth";

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(120, "Name must contain at most 120 characters."),
  avatar: z
    .string()
    .trim()
    .url("Enter a valid image URL.")
    .optional()
    .or(z.literal("")),
});

export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must contain at least 2 characters.")
    .max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens.",
  ),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const organizationUpdateSchema = organizationSchema;

export const organizationDeleteSchema = z.object({
  confirmation: z.string().trim().min(1),
});

export const activeOrganizationSchema = z.object({
  organizationId: z.string().uuid(),
});

export const invitationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),
  role: z.enum(assignableOrganizationRoles),
});

export const membershipRoleSchema = z.object({
  role: z.enum(assignableOrganizationRoles),
});

export const walletLinkSchema = z.object({
  address: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^0x[a-f0-9]{40}$/, "Enter a valid Ethereum address."),
  nonce: z.string().min(24).max(256),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
});

export const personalSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  securityNotifications: z.boolean(),
  decisionNotifications: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PersonalSettingsInput = z.infer<
  typeof personalSettingsSchema
>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type OrganizationDeleteInput = z.infer<
  typeof organizationDeleteSchema
>;
export type InvitationInput = z.infer<typeof invitationSchema>;
