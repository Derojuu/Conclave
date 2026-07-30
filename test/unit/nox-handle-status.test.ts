import { strict as assert } from "node:assert";
import { afterEach, test } from "node:test";

import type { Hex } from "viem";

import {
  retryNoxPublicDecryption,
  waitForResolvedNoxHandles,
} from "../../lib/nox/handle-status";

const originalFetch = globalThis.fetch;
const handle =
  "0x0000aa36a723018f904712603dadbe23a445b2d04586db243fbdc89c750f34f0" as Hex;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("waits until every Nox handle is resolved", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({
      payload: {
        statuses: [{ handle, resolved: calls > 1 }],
      },
    });
  };

  await waitForResolvedNoxHandles([handle], {
    timeoutMs: 5_000,
    initialPollMs: 1,
    maxPollMs: 1,
  });

  assert.equal(calls, 2);
});

test("reports that finalization already succeeded when resolution times out", async () => {
  globalThis.fetch = async () =>
    Response.json({
      payload: {
        statuses: [{ handle, resolved: false }],
      },
    });

  await assert.rejects(
    waitForResolvedNoxHandles([handle], {
      timeoutMs: 5,
      initialPollMs: 1,
      maxPollMs: 1,
    }),
    /campaign is already finalized/i,
  );
});

test("retries while public decryption permissions are propagating", async () => {
  let calls = 0;

  const result = await retryNoxPublicDecryption(
    async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error(
          `Handle (${handle}) does not exist or is not publicly decryptable`,
        );
      }
      return "proof";
    },
    {
      timeoutMs: 5_000,
      initialPollMs: 1,
      maxPollMs: 1,
    },
  );

  assert.equal(result, "proof");
  assert.equal(calls, 2);
});
