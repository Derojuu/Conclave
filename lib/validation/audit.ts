import { z } from "zod";

import { AUDIT_ACTIONS } from "@/constants/audit";

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  action: z.enum(AUDIT_ACTIONS).optional(),
  entity: z
    .string()
    .trim()
    .max(80, "Entity filter is too long.")
    .optional()
    .transform((value) => value || undefined),
});
