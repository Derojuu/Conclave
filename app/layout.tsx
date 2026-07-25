import { Providers } from "@/app/providers";
import { baseMetadata, baseViewport } from "@/lib/metadata";
import "@/styles/globals.css";

export const metadata = baseMetadata;
export const viewport = baseViewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-[#F5F2EB] font-mono text-[#1a1a1a] transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-[#fafafa]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
