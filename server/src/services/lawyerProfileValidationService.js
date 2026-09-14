import {
  getActiveLegalCategories,
  getActiveLocation,
} from "./searchMetadataService.js";

export const ALLOWED_LANGUAGES = ["Sinhala", "Tamil", "English"];
export const ALLOWED_CONSULTATION_MODES = [
  "In Person",
  "Online",
  "Telephone",
];

export class ProfileValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProfileValidationError";
    this.statusCode = 400;
  }
}

export function parseYearsOfPractice(value) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ProfileValidationError(
      "Years of practice must be a non-negative whole number."
    );
  }

  return parsed;
}

export function validateLanguages(values = []) {
  if (!Array.isArray(values)) {
    throw new ProfileValidationError("Languages must be provided as a list.");
  }

  const unique = [...new Set(values.map((value) => String(value).trim()))];
  const invalid = unique.filter(
    (value) => !ALLOWED_LANGUAGES.includes(value)
  );

  if (invalid.length) {
    throw new ProfileValidationError(
      "Please select languages from the available options."
    );
  }

  return unique;
}

export function validateConsultationModes(values = []) {
  if (!Array.isArray(values)) {
    throw new ProfileValidationError(
      "Consultation modes must be provided as a list."
    );
  }

  const unique = [...new Set(values.map((value) => String(value).trim()))];
  const invalid = unique.filter(
    (value) => !ALLOWED_CONSULTATION_MODES.includes(value)
  );

  if (invalid.length) {
    throw new ProfileValidationError(
      "Please select consultation modes from the available options."
    );
  }

  return unique;
}

export async function resolveControlledLocation({
  locationId = "",
  officeCity = "",
} = {}) {
  const location = await getActiveLocation({
    locationId,
    city: officeCity,
  });

  if (!location) {
    throw new ProfileValidationError(
      "Please select a valid office location from the available locations."
    );
  }

  return location;
}

export async function resolveControlledPracticeAreas({
  primaryPracticeArea,
  practiceAreas,
}) {
  const categories = await getActiveLegalCategories();
  const validIds = new Set(categories.map((category) => category.categoryId));
  const primary = String(primaryPracticeArea || "").trim().toLowerCase();

  if (!primary || !validIds.has(primary)) {
    throw new ProfileValidationError(
      "Please select a valid primary practice area."
    );
  }

  const requested = Array.isArray(practiceAreas)
    ? practiceAreas.map((value) => String(value).trim().toLowerCase())
    : [];
  const unique = [...new Set([primary, ...requested].filter(Boolean))];

  if (unique.some((categoryId) => !validIds.has(categoryId))) {
    throw new ProfileValidationError(
      "Please select practice areas from the available categories."
    );
  }

  return {
    primaryPracticeArea: primary,
    practiceAreas: unique,
  };
}
