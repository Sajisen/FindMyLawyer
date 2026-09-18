import test from "node:test";
import assert from "node:assert/strict";

import {
  applyPendingProfileChanges,
  buildPendingProfileChanges,
  splitProfileUpdates,
} from "../src/services/lawyerProfileReviewService.js";

test("splitProfileUpdates keeps operational fields immediate and professional claims reviewable", () => {
  const result = splitProfileUpdates({
    phone: "0712345678",
    languages: ["English"],
    description: "Updated professional description",
    yearsOfPractice: 8,
    locationId: "507f1f77bcf86cd799439011",
  });

  assert.deepEqual(result.immediate, {
    phone: "0712345678",
    languages: ["English"],
  });
  assert.deepEqual(result.review, {
    description: "Updated professional description",
    yearsOfPractice: 8,
    locationId: "507f1f77bcf86cd799439011",
  });
});

test("buildPendingProfileChanges removes a pending field when it is changed back to the approved value", () => {
  const profile = {
    description: "Approved",
    yearsOfPractice: 5,
    pendingProfileChanges: {
      description: "Pending description",
      yearsOfPractice: 7,
    },
  };

  const result = buildPendingProfileChanges(profile, {
    description: "Approved",
  });

  assert.deepEqual(result, { yearsOfPractice: 7 });
});

test("applyPendingProfileChanges applies approved fields and clears review metadata", () => {
  const profile = {
    description: "Old",
    pendingProfileChanges: { description: "New" },
    pendingProfileChangesSubmittedAt: new Date(),
    profileUpdateRejectionReason: "Previous reason",
  };

  assert.equal(applyPendingProfileChanges(profile), true);
  assert.equal(profile.description, "New");
  assert.equal(profile.pendingProfileChanges, null);
  assert.equal(profile.pendingProfileChangesSubmittedAt, null);
  assert.equal(profile.profileUpdateRejectionReason, null);
});
