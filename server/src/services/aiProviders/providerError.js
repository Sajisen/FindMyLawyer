export class AIProviderError extends Error {
  constructor(
    message,
    {
      statusCode = 502,
      provider = "unknown",
      upstreamStatus = null,
      code = "AI_PROVIDER_ERROR",
    } = {}
  ) {
    super(message);
    this.name = "AIProviderError";
    this.statusCode = statusCode;
    this.provider = provider;
    this.upstreamStatus = upstreamStatus;
    this.code = code;
  }
}
