import assert from "node:assert/strict";
import test from "node:test";

import { invitationSchema } from "@/lib/validation/auth";

test("invitations accept admin, evaluator, and observer roles", () => {
  for (const role of ["ADMIN", "EVALUATOR", "OBSERVER"] as const) {
    assert.equal(
      invitationSchema.safeParse({
        email: "member@example.com",
        role,
      }).success,
      true,
    );
  }
});

test("invitations cannot assign owner or platform roles", () => {
  for (const role of ["OWNER", "SUPER_ADMIN", "USER"]) {
    assert.equal(
      invitationSchema.safeParse({
        email: "member@example.com",
        role,
      }).success,
      false,
    );
  }
});
