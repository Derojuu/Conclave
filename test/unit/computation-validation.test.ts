import assert from "node:assert/strict";
import test from "node:test";

import { noxComputationCallbackSchema } from "@/lib/validation/computation";

const submissionId = "11111111-1111-4111-8111-111111111111";

function createCallback() {
  return {
    status: "SUCCEEDED" as const,
    providerTaskId: "task-123",
    chainId: 134,
    transactionHash: `0x${"a".repeat(64)}`,
    receiptHash: "b".repeat(64),
    resultCommitment: "c".repeat(64),
    result: {
      selectedSubmissionId: submissionId,
      decision: "Proceed",
      overallScore: 84.25,
      ranking: [{ submissionId, rank: 1, score: 84.25 }],
      summary: "The aggregate result supports proceeding.",
      consensusSummary:
        "The committee consistently identified strong execution and manageable delivery risk.",
      statistics: {
        submission_count: 1,
        consensus_reached: true,
      } as Record<string, string | number | boolean | null>,
    },
  };
}

test("accepts an aggregate-only successful computation callback", () => {
  assert.equal(
    noxComputationCallbackSchema.safeParse(createCallback()).success,
    true,
  );
});

test("rejects evaluator, identity, comment, and payload statistics", () => {
  for (const forbiddenKey of [
    "evaluator_scores",
    "reviewer_breakdown",
    "judge_notes",
    "individual_rankings",
    "identity_map",
    "private_comments",
    "encrypted_payloads",
  ]) {
    const callback = createCallback();
    callback.result.statistics = {
      [forbiddenKey]: "must not be exposed",
    };

    assert.equal(
      noxComputationCallbackSchema.safeParse(callback).success,
      false,
      forbiddenKey,
    );
  }
});

test("rejects unexpected evaluator-level fields anywhere in the result", () => {
  const callback = {
    ...createCallback(),
    result: {
      ...createCallback().result,
      evaluatorResults: [{ evaluatorId: "hidden", score: 90 }],
    },
  };

  assert.equal(
    noxComputationCallbackSchema.safeParse(callback).success,
    false,
  );
});
