import type { Metadata, Viewport } from "next";

/** Absolute site origin, used for canonical + OG URLs. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://conclave.app";

export const siteConfig = {
  name: "Conclave",
  title: "Conclave | Confidential Decision Infrastructure",
  description:
    "Confidential decision infrastructure for high-stakes evaluation campaigns. Individual scores, comments, and recommendations stay private; only the verified result is revealed.",
  keywords: [
    "confidential computing",
    "confidential decisions",
    "confidential evaluations",
    "evaluation campaigns",
    "iExec Nox",
    "TEE",
    "secure assessment",
    "verifiable results",
  ],
} as const;

/** Root metadata applied to every route; pages may override per-segment. */
export const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/images/conclave-icon.svg",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const baseViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#F5F2EB" },
  ],
  width: "device-width",
  initialScale: 1,
};
