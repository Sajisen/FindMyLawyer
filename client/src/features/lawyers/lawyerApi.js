import { apiRequest, API_URL } from "../../services/api.js";

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

export function getLawyerById(lawyerId) {
  return apiRequest(`/lawyers/${lawyerId}`);
}

export function getLawyersByIds(lawyerIds = []) {
  return apiRequest("/lawyers/batch", {
    method: "POST",
    body: { lawyerIds },
  });
}

export async function uploadMyLawyerProfileImage(file, token) {
  const response = await fetch(`${API_URL}/lawyers/me/profile-image`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Unable to upload profile image.");
  }

  return data;
}

export function removeMyLawyerProfileImage(token) {
  return apiRequest("/lawyers/me/profile-image", {
    method: "DELETE",
    token,
  });
}
