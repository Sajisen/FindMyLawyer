# FindMyLawyer Phase 4: Switchable Gemini and DeepSeek Providers

## Goal

Advanced Search no longer depends on one AI vendor.

The same FindMyLawyer classification pipeline can now use either:

- Gemini
- DeepSeek

The frontend, controlled legal categories, location validation, prompt-injection rules,
input guard, rate limits, response validation and lawyer-search flow stay provider-neutral.

## Recommended configuration

Keep both provider configurations in `server/.env` and switch only `AI_PROVIDER`.

### Use Gemini

```env
AI_PROVIDER=gemini

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-2.5-flash

DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-v4-flash
```

### Switch back to DeepSeek

Change only:

```env
AI_PROVIDER=deepseek
```

Then restart the backend.

Do not move either API key to the React client and do not commit `server/.env`.

## Provider selection behavior

1. If `AI_PROVIDER=gemini`, Gemini is used.
2. If `AI_PROVIDER=deepseek`, DeepSeek is used.
3. If `AI_PROVIDER` is omitted and only one provider key exists, that provider is selected automatically.
4. If both keys exist and `AI_PROVIDER` is omitted, Advanced Search fails with a clear configuration error instead of choosing a vendor unpredictably.
5. If a provider is explicitly selected but its API key is missing, Advanced Search reports a server configuration error.

This is safer than commenting API keys in and out because the selected vendor is always explicit.

## Architecture

```text
AdvancedSearchPanel
       |
POST /api/ai/classify
       |
aiController
       |
input guard + rate limit
       |
aiClassificationService
       |
aiProviderService
    /       \\
Gemini     DeepSeek
    \\       /
 common validated JSON
       |
controlled category validation
controlled location validation
       |
search suggestion
```

Provider-specific HTTP request formats are isolated under:

```text
server/src/services/aiProviders/
```

The classification and business rules therefore do not need to know which vendor is active.

## Gemini implementation

Gemini uses the REST `generateContent` endpoint with:

- `x-goog-api-key` authentication
- a server-side system instruction
- the user description as a separate user message
- JSON structured output
- a JSON schema generated from the currently active legal category IDs
- temperature `0.1`
- a 25-second timeout
- thinking budget set to `0` for this narrow classification task

Gemini output is still validated by FindMyLawyer after the model responds. A model cannot add a legal category that does not exist in the controlled category collection.

## DeepSeek implementation

The existing DeepSeek behavior is preserved in its own provider adapter. The old prompt, JSON response mode, timeout and controlled backend validation remain available.

## Diagnostics

After starting the backend, the console now prints the active provider without exposing a key:

```text
Advanced Search AI provider: gemini (gemini-2.5-flash)
```

or:

```text
Advanced Search AI provider: deepseek (deepseek-v4-flash)
```

Provider-specific network and upstream HTTP errors are also logged on the server with safe diagnostic details. API keys and the user's legal description are not written to those logs.

## Files changed

```text
server/.env.example
server/src/server.js
server/src/services/aiClassificationService.js
server/src/services/aiProviders/providerError.js
server/src/services/aiProviders/aiProviderService.js
server/src/services/aiProviders/deepSeekProvider.js
server/src/services/aiProviders/geminiProvider.js
AI_TEST_SCENARIOS.md
README-PHASE4.md
```

No new npm package is required.

## Quick test

1. Put both API keys in `server/.env`.
2. Set:

```env
AI_PROVIDER=gemini
```

3. Restart:

```powershell
cd server
npm run dev
```

4. Confirm the startup line says Gemini.
5. Use Advanced Search with a known test case such as:

```text
My mobile phone was stolen while I was in Colombo yesterday. I want to find a lawyer who handles this kind of problem, but I do not know which legal area to choose.
```

Expected primary category:

```text
Criminal Law
```

6. Change only:

```env
AI_PROVIDER=deepseek
```

7. Restart the backend and repeat the same test when DeepSeek is available on the current network/device.
