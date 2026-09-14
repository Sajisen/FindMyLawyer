import {
  getDeepSeekConfig,
  requestDeepSeekClassification,
} from "./deepSeekProvider.js";
import {
  getGeminiConfig,
  requestGeminiClassification,
} from "./geminiProvider.js";
import { AIProviderError } from "./providerError.js";

const SUPPORTED_PROVIDERS = new Set(["deepseek", "gemini"]);

function normalizeProviderName(value = "") {
  return String(value).trim().toLowerCase();
}

export function resolveAIProvider() {
  const explicitlyConfigured = normalizeProviderName(process.env.AI_PROVIDER);

  if (explicitlyConfigured) {
    if (!SUPPORTED_PROVIDERS.has(explicitlyConfigured)) {
      throw new AIProviderError(
        `Unsupported AI_PROVIDER value: ${explicitlyConfigured}.`,
        {
          statusCode: 503,
          provider: explicitlyConfigured,
          code: "AI_PROVIDER_INVALID_CONFIG",
        }
      );
    }

    const selectedConfig =
      explicitlyConfigured === "deepseek"
        ? getDeepSeekConfig()
        : getGeminiConfig();

    if (!selectedConfig.configured) {
      throw new AIProviderError(
        `${explicitlyConfigured} is selected, but its API key is not configured.`,
        {
          statusCode: 503,
          provider: explicitlyConfigured,
          code: "AI_PROVIDER_NOT_CONFIGURED",
        }
      );
    }

    return explicitlyConfigured;
  }

  const deepSeekConfigured = getDeepSeekConfig().configured;
  const geminiConfigured = getGeminiConfig().configured;

  if (deepSeekConfigured && !geminiConfigured) {
    return "deepseek";
  }

  if (geminiConfigured && !deepSeekConfigured) {
    return "gemini";
  }

  if (!deepSeekConfigured && !geminiConfigured) {
    throw new AIProviderError(
      "Advanced Search is not configured on the server yet.",
      {
        statusCode: 503,
        provider: "none",
        code: "AI_PROVIDER_NOT_CONFIGURED",
      }
    );
  }

  throw new AIProviderError(
    "Both AI providers are configured. Set AI_PROVIDER to either deepseek or gemini.",
    {
      statusCode: 503,
      provider: "multiple",
      code: "AI_PROVIDER_AMBIGUOUS_CONFIG",
    }
  );
}

export function getAIProviderStatus() {
  const deepseek = getDeepSeekConfig();
  const gemini = getGeminiConfig();

  let activeProvider = null;
  let configurationError = null;

  try {
    activeProvider = resolveAIProvider();
  } catch (error) {
    configurationError = error.message;
  }

  const activeConfig =
    activeProvider === "deepseek"
      ? deepseek
      : activeProvider === "gemini"
        ? gemini
        : null;

  return {
    activeProvider,
    configured: Boolean(activeConfig?.configured),
    model: activeConfig?.model || null,
    providers: {
      deepseek: {
        configured: deepseek.configured,
      },
      gemini: {
        configured: gemini.configured,
      },
    },
    configurationError,
  };
}

export async function requestAIClassification({
  systemPrompt,
  description,
  categoryIds,
}) {
  const provider = resolveAIProvider();

  if (provider === "gemini") {
    return requestGeminiClassification({
      systemPrompt,
      description,
      categoryIds,
    });
  }

  return requestDeepSeekClassification({
    systemPrompt,
    description,
  });
}
