import { AIProviderError } from "./providerError.js";

const PROVIDER_NAME = "deepseek";

const LEGACY_MODEL_MAP = {
  "deepseek-chat": "deepseek-v4-flash",
  "deepseek-reasoner": "deepseek-v4-pro",
};

function getConfiguredModel() {
  const configured = String(
    process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"
  ).trim();

  return LEGACY_MODEL_MAP[configured] || configured;
}

function getConfiguredApiUrl() {
  const configured = String(
    process.env.DEEPSEEK_API_URL ||
      "https://api.deepseek.com/chat/completions"
  ).trim();

  if (/\/chat\/completions\/?$/i.test(configured)) {
    return configured.replace(/\/$/, "");
  }

  return `${configured.replace(/\/$/, "")}/chat/completions`;
}

function mapDeepSeekFailure(status) {
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

export function getDeepSeekConfig() {
  return {
    provider: PROVIDER_NAME,
    configured: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
    model: getConfiguredModel(),
  };
}

export async function requestDeepSeekClassification({
  systemPrompt,
  description,
  timeoutMs = 25000,
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new AIProviderError(
      "DeepSeek is selected, but DEEPSEEK_API_KEY is not configured.",
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
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getConfiguredModel(),
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: description,
          },
        ],
        response_format: {
          type: "json_object",
        },
        thinking: {
          type: "disabled",
        },
        temperature: 0.1,
        max_tokens: 600,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw mapDeepSeekFailure(response.status);
    }

    const payload = await response.json();
    const choice = payload?.choices?.[0];

    if (choice?.finish_reason === "length") {
      throw new AIProviderError(
        "The AI response was incomplete. Please try again.",
        {
          provider: PROVIDER_NAME,
          statusCode: 502,
          code: "AI_PROVIDER_INCOMPLETE_RESPONSE",
        }
      );
    }

    if (choice?.finish_reason === "content_filter") {
      throw new AIProviderError(
        "The description could not be analyzed. Please rephrase it and try again.",
        {
          provider: PROVIDER_NAME,
          statusCode: 400,
          code: "AI_PROVIDER_CONTENT_FILTERED",
        }
      );
    }

    if (choice?.finish_reason === "insufficient_system_resource") {
      throw new AIProviderError(
        "The AI service is temporarily unavailable. Please try again shortly.",
        {
          provider: PROVIDER_NAME,
          statusCode: 503,
          code: "AI_PROVIDER_UPSTREAM_UNAVAILABLE",
        }
      );
    }

    return choice?.message?.content || "";
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

    console.error("DeepSeek network error:", error?.code || error?.message || error);

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
