import { AIProviderError } from "./providerError.js";

const PROVIDER_NAME = "gemini";
const DEFAULT_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash";

function getConfiguredModel() {
  return String(process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
}

function getConfiguredApiUrl() {
  const configured = String(
    process.env.GEMINI_API_URL || DEFAULT_API_BASE_URL
  ).trim();
  const model = encodeURIComponent(getConfiguredModel());

  if (configured.includes("{model}")) {
    return configured.replace("{model}", model);
  }

  if (/:generateContent\/?$/i.test(configured)) {
    return configured.replace(/\/$/, "");
  }

  return `${configured.replace(/\/$/, "")}/models/${model}:generateContent`;
}

function buildResponseJsonSchema(categoryIds) {
  return {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["valid", "unclear", "irrelevant"],
      },
      primaryCategoryId: {
        type: "string",
        enum: categoryIds,
      },
      alternativeCategoryIds: {
        type: "array",
        items: {
          type: "string",
          enum: categoryIds,
        },
        maxItems: 2,
      },
      inputLanguage: {
        type: "string",
        enum: [
          "english",
          "sinhala",
          "sinhala_romanized",
          "tamil",
          "tamil_romanized",
          "mixed",
          "unknown",
        ],
      },
      reason: {
        type: "string",
      },
      locationCandidates: {
        type: "array",
        items: {
          type: "string",
        },
        maxItems: 3,
      },
    },
    required: [
      "status",
      "primaryCategoryId",
      "alternativeCategoryIds",
      "inputLanguage",
      "reason",
      "locationCandidates",
    ],
    additionalProperties: false,
  };
}

function mapGeminiFailure(status) {
  if (status === 400) {
    return new AIProviderError(
      "The AI classification request was not accepted by the configured provider.",
      {
        provider: PROVIDER_NAME,
        statusCode: 502,
        upstreamStatus: status,
        code: "AI_PROVIDER_BAD_REQUEST",
      }
    );
  }

  if (status === 401 || status === 403) {
    return new AIProviderError(
      "The configured AI provider could not authenticate the request.",
      {
        provider: PROVIDER_NAME,
        statusCode: 503,
        upstreamStatus: status,
        code: "AI_PROVIDER_AUTH_FAILED",
      }
    );
  }

  if (status === 429) {
    return new AIProviderError(
      "The AI service is busy right now. Please wait a moment and try again.",
      {
        provider: PROVIDER_NAME,
        statusCode: 503,
        upstreamStatus: status,
        code: "AI_PROVIDER_RATE_LIMITED",
      }
    );
  }

  if (status >= 500) {
    return new AIProviderError(
      "The AI service is temporarily unavailable. Please try again shortly.",
      {
        provider: PROVIDER_NAME,
        statusCode: 503,
        upstreamStatus: status,
        code: "AI_PROVIDER_UPSTREAM_UNAVAILABLE",
      }
    );
  }

  return new AIProviderError(
    "The AI classification service could not complete the request.",
    {
      provider: PROVIDER_NAME,
      statusCode: 502,
      upstreamStatus: status,
      code: "AI_PROVIDER_REQUEST_FAILED",
    }
  );
}

function extractGeminiText(payload) {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

export function getGeminiConfig() {
  return {
    provider: PROVIDER_NAME,
    configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    model: getConfiguredModel(),
  };
}

export async function requestGeminiClassification({
  systemPrompt,
  description,
  categoryIds,
  timeoutMs = 25000,
}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new AIProviderError(
      "Gemini is selected, but GEMINI_API_KEY is not configured.",
      {
        provider: PROVIDER_NAME,
        statusCode: 503,
        code: "AI_PROVIDER_NOT_CONFIGURED",
      }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getConfiguredApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: description }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 600,
          responseMimeType: "application/json",
          responseJsonSchema: buildResponseJsonSchema(categoryIds),
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let providerMessage = "";

      try {
        const errorPayload = await response.json();
        providerMessage = String(errorPayload?.error?.message || "").slice(0, 300);
      } catch {
        // Keep the user-facing response generic if the upstream body is not JSON.
      }

      console.error(
        `Gemini classification request failed: ${response.status}${
          providerMessage ? ` - ${providerMessage}` : ""
        }`
      );

      throw mapGeminiFailure(response.status);
    }

    const payload = await response.json();
    const candidate = payload?.candidates?.[0];
    const finishReason = String(candidate?.finishReason || "").toUpperCase();

    if (finishReason === "MAX_TOKENS") {
      throw new AIProviderError(
        "The AI response was incomplete. Please try again.",
        {
          provider: PROVIDER_NAME,
          statusCode: 502,
          code: "AI_PROVIDER_INCOMPLETE_RESPONSE",
        }
      );
    }

    if (["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT"].includes(finishReason)) {
      throw new AIProviderError(
        "The description could not be analyzed. Please rephrase it and try again.",
        {
          provider: PROVIDER_NAME,
          statusCode: 400,
          code: "AI_PROVIDER_CONTENT_FILTERED",
        }
      );
    }

    return extractGeminiText(payload);
  } catch (error) {
    if (error instanceof AIProviderError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new AIProviderError(
        "The AI service took too long to respond. Please try again.",
        {
          provider: PROVIDER_NAME,
          statusCode: 504,
          code: "AI_PROVIDER_TIMEOUT",
        }
      );
    }

    console.error("Gemini network error:", error?.code || error?.message || error);

    throw new AIProviderError(
      "Unable to reach the AI classification service.",
      {
        provider: PROVIDER_NAME,
        statusCode: 502,
        code: "AI_PROVIDER_NETWORK_ERROR",
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
