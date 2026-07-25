import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export function getPagination(input?: {
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, Math.trunc(input?.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.trunc(input?.pageSize ?? DEFAULT_PAGE_SIZE)),
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeWalletAddress(address: string) {
  return address.trim().toLowerCase();
}

export async function withTransaction<T>(
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(operation, {
    maxWait: 5_000,
    timeout: 15_000,
  });
}
