import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeVerificationRejectionScope,
  requiresVerificationDocumentResubmission,
  shouldRequeueVerificationAfterProfileEdit,
} from "../src/services/verificationWorkflowService.js";

test("legacy or unknown rejection scopes default to the safer 'both' behavior", () => {
  assert.equal(normalizeVerificationRejectionScope(undefined), "both");
  assert.equal(normalizeVerificationRejectionScope("unexpected"), "both");
});

test("profile-only rejection requeues after a profile edit without document resubmission", () => {
  const record = { status: "rejected", rejectionScope: "profile" };

  assert.equal(shouldRequeueVerificationAfterProfileEdit(record), true);
  assert.equal(requiresVerificationDocumentResubmission(record), false);
});

test("document rejection remains rejected until corrected files are resubmitted", () => {
  const record = { status: "rejected", rejectionScope: "documents" };

  assert.equal(shouldRequeueVerificationAfterProfileEdit(record), false);
  assert.equal(requiresVerificationDocumentResubmission(record), true);
});

test("both-scope and legacy rejected records require document resubmission", () => {
  assert.equal(
    requiresVerificationDocumentResubmission({
      status: "rejected",
      rejectionScope: "both",
    }),
    true
  );
  assert.equal(
    requiresVerificationDocumentResubmission({ status: "rejected" }),
    true
  );
});

test("non-rejected verification records are never treated as resubmittable", () => {
  assert.equal(
    requiresVerificationDocumentResubmission({
      status: "pending",
      rejectionScope: "documents",
    }),
    false
  );
  assert.equal(
    shouldRequeueVerificationAfterProfileEdit({
      status: "approved",
      rejectionScope: "profile",
    }),
    false
  );
});
