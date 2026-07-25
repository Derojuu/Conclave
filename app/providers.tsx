"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";

import { ClientAuthProvider } from "@/components/auth/client-auth-provider";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

const wagmiConfig = projectId
  ? getDefaultConfig({
      appName: "Conclave",
      projectId,
      chains: [sepolia],
      ssr: true,
      transports: {
        [sepolia.id]: http(rpcUrl || undefined),
      },
    })
  : createConfig({
      chains: [sepolia],
      connectors: [injected()],
      ssr: true,
      transports: {
        [sepolia.id]: http(rpcUrl || undefined),
      },
    });

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ClientAuthProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ClientAuthProvider>
    </ThemeProvider>
  );
}
