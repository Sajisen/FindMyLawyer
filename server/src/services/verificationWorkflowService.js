export const VERIFICATION_REJECTION_SCOPES = [
  "profile",
  "documents",
  "both",
];

export function normalizeVerificationRejectionScope(value) {
  return VERIFICATION_REJECTION_SCOPES.includes(value) ? value : "both";
}

export function requiresVerificationDocumentResubmission(record) {
  return (
    record?.status === "rejected" &&
    normalizeVerificationRejectionScope(record.rejectionScope) !== "profile"
  );
}

export function shouldRequeueVerificationAfterProfileEdit(record) {
  return (
    record?.status === "rejected" &&
    normalizeVerificationRejectionScope(record.rejectionScope) === "profile"
  );
}
