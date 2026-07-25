import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMPAIGN_STATUSES,
  campaignStatusTransitions,
  canTransitionCampaignStatus,
} from "@/constants/campaign";

test("campaign lifecycle exposes only deliberate manual transitions", () => {
  assert.deepEqual(campaignStatusTransitions, {
    DRAFT: ["OPEN", "ARCHIVED"],
    OPEN: ["DRAFT", "EVALUATING"],
    EVALUATING: [],
    COMPUTING: [],
    COMPLETED: ["ARCHIVED"],
    ARCHIVED: [],
  });
});

test("computing and completion cannot be entered manually", () => {
  for (const current of CAMPAIGN_STATUSES) {
    assert.equal(canTransitionCampaignStatus(current, "COMPUTING"), false);
    assert.equal(canTransitionCampaignStatus(current, "COMPLETED"), false);
  }
});

test("archived campaigns are terminal", () => {
  for (const next of CAMPAIGN_STATUSES) {
    assert.equal(canTransitionCampaignStatus("ARCHIVED", next), false);
  }
});
