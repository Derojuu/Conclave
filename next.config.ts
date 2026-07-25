import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source:
          "/organizations/:organizationId/committees/:committeeId/projects/:projectId/team",
        destination:
          "/organizations/:organizationId/campaigns/:committeeId/submissions/:projectId/contributors",
        permanent: true,
      },
      {
        source:
          "/organizations/:organizationId/committees/:committeeId/projects/:projectId/:path*",
        destination:
          "/organizations/:organizationId/campaigns/:committeeId/submissions/:projectId/:path*",
        permanent: true,
      },
      {
        source:
          "/organizations/:organizationId/committees/:committeeId/projects",
        destination:
          "/organizations/:organizationId/campaigns/:committeeId/submissions",
        permanent: true,
      },
      {
        source:
          "/organizations/:organizationId/committees/:committeeId/judges",
        destination:
          "/organizations/:organizationId/campaigns/:committeeId/evaluators",
        permanent: true,
      },
      {
        source:
          "/organizations/:organizationId/committees/:committeeId/:path*",
        destination:
          "/organizations/:organizationId/campaigns/:committeeId/:path*",
        permanent: true,
      },
      {
        source: "/organizations/:organizationId/committees",
        destination: "/organizations/:organizationId/campaigns",
        permanent: true,
      },
      {
        source:
          "/organizations/:organizationId/campaigns/:campaignId/submissions/:submissionId/team",
        destination:
          "/organizations/:organizationId/campaigns/:campaignId/submissions/:submissionId/contributors",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
