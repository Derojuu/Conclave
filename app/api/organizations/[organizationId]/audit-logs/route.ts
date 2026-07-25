import { NextResponse } from "next/server";

import { ORGANIZATION_PERMISSIONS } from "@/constants/auth";
import { apiError } from "@/lib/api-response";
import { getPagination } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganizationPermission } from "@/lib/security/rbac";
import { auditLogQuerySchema } from "@/lib/validation/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    const { organizationId } = await params;
    await requireCurrentOrganizationPermission(
      organizationId,
      ORGANIZATION_PERMISSIONS.auditLogsRead,
    );
    const url = new URL(request.url);
    const input = auditLogQuerySchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      action: url.searchParams.get("action") ?? undefined,
      entity: url.searchParams.get("entity") ?? undefined,
    });
    const pagination = getPagination(input);
    const where = {
      organizationId,
      ...(input.action ? { action: input.action } : {}),
      ...(input.entity
        ? {
            entityType: {
              contains: input.entity,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
          campaign: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        pages: Math.max(1, Math.ceil(total / pagination.pageSize)),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
