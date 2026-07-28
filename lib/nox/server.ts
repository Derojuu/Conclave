import "server-only";

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

import { ConfigurationError } from "@/lib/security/errors";

export function getNoxPublicClient() {
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim();
  if (!rpcUrl) {
    throw new ConfigurationError("NEXT_PUBLIC_SEPOLIA_RPC_URL is required.");
  }

  return createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
}
