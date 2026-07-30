import type { Hex } from "viem";

const NOX_TESTNET_GATEWAY_URL = "https://gateway-testnets.noxprotocol.dev";

type HandleStatusResponse = {
  payload?: {
    statuses?: Array<{
      handle?: string;
      resolved?: boolean;
    }>;
  };
};

type WaitOptions = {
  timeoutMs?: number;
  initialPollMs?: number;
  maxPollMs?: number;
};

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export async function waitForResolvedNoxHandles(
  handles: readonly Hex[],
  {
    timeoutMs = 120_000,
    initialPollMs = 1_000,
    maxPollMs = 5_000,
  }: WaitOptions = {},
): Promise<void> {
  const expected = new Set(handles.map((handle) => handle.toLowerCase()));
  const deadline = Date.now() + timeoutMs;
  let pollMs = initialPollMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(
        `${NOX_TESTNET_GATEWAY_URL}/v0/public/handles/status`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ handles }),
        },
      );
      if (response.ok) {
        const body = (await response.json()) as HandleStatusResponse;
        const resolved = new Set(
          (body.payload?.statuses ?? [])
            .filter((status) => status.resolved && status.handle)
            .map((status) => status.handle!.toLowerCase()),
        );
        if ([...expected].every((handle) => resolved.has(handle))) return;
      }
    } catch {
      // Transient gateway errors are retried until the timeout expires.
    }

    await sleep(pollMs);
    pollMs = Math.min(Math.round(pollMs * 1.5), maxPollMs);
  }

  throw new Error(
    "Nox is still processing the aggregate handles. The campaign is already finalized; wait a minute and try publishing again.",
  );
}

export async function retryNoxPublicDecryption<T>(
  decrypt: () => Promise<T>,
  {
    timeoutMs = 120_000,
    initialPollMs = 1_000,
    maxPollMs = 5_000,
  }: WaitOptions = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let pollMs = initialPollMs;

  while (Date.now() < deadline) {
    try {
      return await decrypt();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        !message.includes("does not exist or is not publicly decryptable") &&
        !message.includes("NotYetComputedHandle")
      ) {
        throw error;
      }
    }

    await sleep(pollMs);
    pollMs = Math.min(Math.round(pollMs * 1.5), maxPollMs);
  }

  throw new Error(
    "Nox has not made the aggregate publicly decryptable yet. The campaign is already finalized; wait a minute and try publishing again.",
  );
}
