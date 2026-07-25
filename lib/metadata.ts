import type { Metadata, Viewport } from "next";

/** Absolute site origin, used for canonical + OG URLs. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://conclave-nox.vercel.app";

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
  publisher: siteConfig.name,
  category: "technology",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/images/conclave-icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/images/conclave-icon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: "/images/conclave-icon-32.png",
    apple: [
      {
        url: "/images/conclave-apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteUrl,
    locale: "en_US",
    images: [
      {
        url: "/images/conclave-social.png",
        width: 1200,
        height: 630,
        alt: "Conclave - The Confidential Decision Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/images/conclave-social.png"],
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
