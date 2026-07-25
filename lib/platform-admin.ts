import "server-only";

import { prisma } from "@/lib/prisma";

export async function getPlatformOverview() {
  const [
    userCount,
    organizationCount,
    campaignCount,
    verifiedResultCount,
    activeComputationCount,
    failedComputationCount,
    recentUsers,
    recentOrganizations,
    recentComputations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.evaluationCampaign.count(),
    prisma.decisionResult.count({ where: { status: "VERIFIED" } }),
    prisma.computationJob.count({
      where: { status: { in: ["PENDING", "QUEUED", "RUNNING"] } },
    }),
    prisma.computationJob.count({ where: { status: "FAILED" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        fullName: true,
        email: true,
        platformRole: true,
        createdAt: true,
        _count: { select: { memberships: true } },
      },
    }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        owner: { select: { fullName: true, email: true } },
        _count: { select: { members: true, campaigns: true } },
      },
    }),
    prisma.computationJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        provider: true,
        providerTaskId: true,
        createdAt: true,
        campaign: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            organization: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return {
    stats: {
      userCount,
      organizationCount,
      campaignCount,
      verifiedResultCount,
      activeComputationCount,
      failedComputationCount,
    },
    recentUsers,
    recentOrganizations,
    recentComputations,
  };
}
