import { apiRequest } from "../../services/api.js";

export async function analyzeLegalSituation(description) {
  return apiRequest("/ai/classify", {
    method: "POST",
    body: {
      description,
    },
  });
}
