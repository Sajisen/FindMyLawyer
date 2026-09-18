export const REVIEW_REQUIRED_PROFILE_FIELDS = [
  "displayName",
  "professionalTitle",
  "locationId",
  "officeCity",
  "district",
  "province",
  "primaryPracticeArea",
  "practiceAreas",
  "subAreas",
  "yearsOfPractice",
  "description",
];

export const IMMEDIATE_PROFILE_FIELDS = [
  "email",
  "phone",
  "languages",
  "consultationModes",
  "acceptingNewClients",
];

function normalizeComparable(field, value) {
  if (field === "locationId") {
    return value ? String(value) : "";
  }

  if (Array.isArray(value)) {
    const normalized = value.map((item) => String(item ?? "").trim());

    if (field === "practiceAreas" || field === "subAreas") {
      return [...normalized].sort();
    }

    return normalized;
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (value === undefined) {
    return null;
  }

  return value;
}

function valuesEqual(field, left, right) {
  return (
    JSON.stringify(normalizeComparable(field, left)) ===
    JSON.stringify(normalizeComparable(field, right))
  );
}

export function buildPendingProfileChanges(profile, reviewUpdates = {}) {
  const pending = {
    ...(profile.pendingProfileChanges || {}),
  };

  for (const field of REVIEW_REQUIRED_PROFILE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(reviewUpdates, field)) {
      continue;
    }

    const nextValue = reviewUpdates[field];

    if (valuesEqual(field, profile[field], nextValue)) {
      delete pending[field];
    } else {
      pending[field] = nextValue;
    }
  }

  return Object.keys(pending).length > 0 ? pending : null;
}

export function applyPendingProfileChanges(profile) {
  const pending = profile.pendingProfileChanges;

  if (!pending || typeof pending !== "object") {
    return false;
  }

  let applied = false;

  for (const field of REVIEW_REQUIRED_PROFILE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(pending, field)) {
      continue;
    }

    profile[field] = pending[field];
    applied = true;
  }

  profile.pendingProfileChanges = null;
  profile.pendingProfileChangesSubmittedAt = null;
  profile.profileUpdateRejectionReason = null;

  return applied;
}

export function splitProfileUpdates(updates = {}) {
  const immediate = {};
  const review = {};

  for (const [field, value] of Object.entries(updates)) {
    if (IMMEDIATE_PROFILE_FIELDS.includes(field)) {
      immediate[field] = value;
    } else if (REVIEW_REQUIRED_PROFILE_FIELDS.includes(field)) {
      review[field] = value;
    }
  }

  return { immediate, review };
}
