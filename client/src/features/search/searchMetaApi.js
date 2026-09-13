import { apiRequest } from "../../services/api.js";

export async function getLegalCategories() {
  return apiRequest("/meta/categories");
}

export async function getLocationSuggestions(query = "") {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    params.set("query", trimmedQuery);
  }

  const queryString = params.toString();

  return apiRequest(
    `/meta/locations${queryString ? `?${queryString}` : ""}`
  );
}
