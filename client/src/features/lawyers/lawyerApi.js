import { apiRequest } from "../../services/api.js";

export async function searchLawyers(filters, { page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set("practiceArea", filters.category);
  }

  if (filters.locationId) {
    params.set("locationId", filters.locationId);
  } else if (filters.location?.trim()) {
    // Backward-compatible fallback for old shared URLs. The backend still
    // validates this against the controlled locations collection.
    params.set("city", filters.location.trim());
  }

  if (filters.language) {
    params.set("language", filters.language);
  }

  if (filters.consultationMode) {
    params.set("consultationMode", filters.consultationMode);
  }

  if (filters.minExperience) {
    params.set("minExperience", filters.minExperience);
  }

  if (filters.acceptingNewClients) {
    params.set("acceptingNewClients", "true");
  }

  params.set("page", String(page));
  params.set("limit", String(limit));

  return apiRequest(`/lawyers?${params.toString()}`);
}
