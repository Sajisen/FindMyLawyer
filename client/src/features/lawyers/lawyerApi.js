import {
  apiRequest,
} from "../../services/apiClient.js";

export async function searchLawyers(filters) {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set(
      "categories",
      filters.category
    );
  }

  if (filters.location.trim()) {
    params.set(
      "city",
      filters.location.trim()
    );
  }

  if (filters.language) {
    params.set(
      "language",
      filters.language
    );
  }

  if (filters.consultationMode) {
    params.set(
      "consultationMode",
      filters.consultationMode
    );
  }

  if (filters.minExperience) {
    params.set(
      "minExperience",
      filters.minExperience
    );
  }

  const queryString =
    params.toString();

  return apiRequest(
    `/lawyers${queryString ? `?${queryString}` : ""}`
  );
}