import { apiRequest } from "../../services/api.js";

export function getSavedLawyers(token) {
  return apiRequest("/saved-lawyers", { token });
}

export function saveLawyerToAccount(lawyerId, token) {
  return apiRequest(`/saved-lawyers/${lawyerId}`, {
    method: "POST",
    token,
  });
}

export function removeLawyerFromAccount(lawyerId, token) {
  return apiRequest(`/saved-lawyers/${lawyerId}`, {
    method: "DELETE",
    token,
  });
}

export function syncGuestSavedLawyers(lawyerIds, token) {
  return apiRequest("/saved-lawyers/sync", {
    method: "POST",
    token,
    body: { lawyerIds },
  });
}
