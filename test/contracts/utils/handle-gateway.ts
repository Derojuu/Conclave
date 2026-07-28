import { setTimeout as sleep } from "node:timers/promises";

import { handleGatewayUrl } from "@iexec-nox/nox-hardhat-plugin";
import type { Hex } from "viem";

export async function waitForHandleResolved(
  handle: Hex,
  timeoutMs = 60_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let pollMs = 500;

  while (Date.now() < deadline) {
    const response = await fetch(
      `${handleGatewayUrl}/v0/public/handles/status`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handles: [handle] }),
      },
    );
    if (response.ok) {
      const body = (await response.json()) as {
        payload: { statuses: Array<{ handle: string; resolved: boolean }> };
      };
      if (
        body.payload.statuses.some(
          (status) =>
            status.handle.toLowerCase() === handle.toLowerCase() &&
            status.resolved,
        )
      ) {
        return;
      }
    }
    await sleep(pollMs);
    pollMs = Math.min(Math.round(pollMs * 1.5), 5_000);
  }

  throw new Error(`Nox handle ${handle} was not resolved before timeout.`);
}
