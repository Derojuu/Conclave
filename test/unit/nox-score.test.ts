import assert from "node:assert/strict";
import test from "node:test";

import { computeNoxWeightedScore } from "@/lib/nox/score";

test("normalizes weighted numeric and boolean criteria to the Nox score scale", () => {
  const score = computeNoxWeightedScore([
    {
      type: "NUMERIC",
      weight: 3,
      minScore: 0,
      maxScore: 10,
      value: 8,
    },
    {
      type: "BOOLEAN",
      weight: 1,
      minScore: 0,
      maxScore: 1,
      value: true,
    },
  ]);

  assert.equal(score, 850_000n);
});

test("maps pass/fail criteria without exposing the value on-chain", () => {
  assert.equal(
    computeNoxWeightedScore([
      {
        type: "PASS_FAIL",
        weight: 1,
        minScore: 0,
        maxScore: 1,
        value: "PASS",
      },
    ]),
    1_000_000n,
  );
});

test("requires at least one Nox-compatible scored criterion", () => {
  assert.throws(() =>
    computeNoxWeightedScore([
      {
        type: "RUBRIC",
        weight: 1,
        minScore: 0,
        maxScore: 10,
        value: "Excellent",
      },
    ]),
  );
});
