import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { nox } from "@iexec-nox/nox-hardhat-plugin";
import { keccak256, toHex, type Hex } from "viem";

import { waitForHandleResolved } from "./utils/handle-gateway.js";

describe("ConfidentialDecisionEngine end-to-end", () => {
  it(
    "aggregates encrypted scores and publishes only verified totals",
    { timeout: 240_000 },
    async () => {
      const { viem } = await nox.connect();
      const publicClient = await viem.getPublicClient();
      const [administrator] = await viem.getWalletClients();
      const engine = await viem.deployContract("ConfidentialDecisionEngine");
      const campaignId = keccak256(toHex("campaign-1"));
      const submissionIds = [
        keccak256(toHex("submission-a")),
        keccak256(toHex("submission-b")),
      ];

      const createHash = await engine.write.createCampaign([
        campaignId,
        submissionIds,
        [administrator.account.address],
      ]);
      await publicClient.waitForTransactionReceipt({ hash: createHash });

      for (const [index, score] of [750_000n, 500_000n].entries()) {
        const encrypted = await nox.encryptInput(
          score,
          "uint256",
          engine.address,
        );
        const submitHash = await engine.write.submitScore([
          campaignId,
          submissionIds[index],
          encrypted.handle,
          encrypted.handleProof,
        ]);
        await publicClient.waitForTransactionReceipt({ hash: submitHash });
      }

      assert.equal(
        await engine.read.getSubmissionCount([campaignId, submissionIds[0]]),
        1,
      );
      assert.equal(
        await engine.read.hasSubmitted([
          campaignId,
          submissionIds[0],
          administrator.account.address,
        ]),
        true,
      );

      const finalizeHash = await engine.write.finalizeCampaign([campaignId]);
      await publicClient.waitForTransactionReceipt({ hash: finalizeHash });

      const proofs: Hex[] = [];
      for (const submissionId of submissionIds) {
        const handle = (await engine.read.getAggregateHandle([
          campaignId,
          submissionId,
        ])) as Hex;
        await waitForHandleResolved(handle);
        const decrypted = await nox.publicDecrypt(handle);
        proofs.push(decrypted.decryptionProof);
      }

      const publishHash = await engine.write.publishResults([
        campaignId,
        proofs,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: publishHash });

      assert.equal(
        await engine.read.getPublishedTotal([campaignId, submissionIds[0]]),
        750_000n,
      );
      assert.equal(
        await engine.read.getPublishedTotal([campaignId, submissionIds[1]]),
        500_000n,
      );
      const winner = await engine.read.getPublishedWinner([campaignId]);
      assert.equal(winner[0], submissionIds[0]);
      assert.equal(winner[1], 750_000n);
    },
  );
});
