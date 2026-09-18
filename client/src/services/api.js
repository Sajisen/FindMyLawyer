const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

export const API_URL = (
  configuredApiUrl || "http://localhost:5000/api"
).replace(/\/+$/, "");

export async function apiRequest(
  endpoint,
  {
    method = "GET",
    body,
    token,
  } = {}
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong.");
  }

  return data;
}

export function resolveApiAssetUrl(value) {
  const assetPath = String(value || "").trim();

  if (!assetPath) {
    return "";
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  try {
    const apiUrl = new URL(API_URL, window.location.origin);
    return new URL(assetPath, apiUrl.origin).toString();
  } catch {
    return assetPath;
  }
}
