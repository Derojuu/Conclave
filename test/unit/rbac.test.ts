import assert from "node:assert/strict";
import test from "node:test";

import {
  ORGANIZATION_PERMISSIONS,
  roleHasPermission,
} from "@/constants/auth";

test("organization owner has every organization permission", () => {
  for (const permission of Object.values(ORGANIZATION_PERMISSIONS)) {
    assert.equal(roleHasPermission("OWNER", permission), true);
  }
});

test("organization admin cannot delete the organization or submit evaluations", () => {
  assert.equal(
    roleHasPermission("ADMIN", ORGANIZATION_PERMISSIONS.delete),
    false,
  );
  assert.equal(
    roleHasPermission(
      "ADMIN",
      ORGANIZATION_PERMISSIONS.evaluationsSubmit,
    ),
    false,
  );
  assert.equal(
    roleHasPermission("ADMIN", ORGANIZATION_PERMISSIONS.campaignsManage),
    true,
  );
});

test("evaluator can submit evaluations but cannot manage campaigns or results", () => {
  assert.equal(
    roleHasPermission(
      "EVALUATOR",
      ORGANIZATION_PERMISSIONS.evaluationsSubmit,
    ),
    true,
  );
  assert.equal(
    roleHasPermission(
      "EVALUATOR",
      ORGANIZATION_PERMISSIONS.campaignsManage,
    ),
    false,
  );
  assert.equal(
    roleHasPermission(
      "EVALUATOR",
      ORGANIZATION_PERMISSIONS.resultsPublish,
    ),
    false,
  );
});

test("observer remains read-only", () => {
  assert.equal(
    roleHasPermission("OBSERVER", ORGANIZATION_PERMISSIONS.resultsRead),
    true,
  );

  for (const permission of [
    ORGANIZATION_PERMISSIONS.update,
    ORGANIZATION_PERMISSIONS.membersManage,
    ORGANIZATION_PERMISSIONS.invitationsManage,
    ORGANIZATION_PERMISSIONS.campaignsManage,
    ORGANIZATION_PERMISSIONS.templatesManage,
    ORGANIZATION_PERMISSIONS.submissionsManage,
    ORGANIZATION_PERMISSIONS.evaluationsSubmit,
    ORGANIZATION_PERMISSIONS.resultsPublish,
    ORGANIZATION_PERMISSIONS.auditLogsRead,
  ]) {
    assert.equal(roleHasPermission("OBSERVER", permission), false);
  }
});
