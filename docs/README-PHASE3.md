# FindMyLawyer Phase 3: Search UX, Advanced Search Hardening and AI Safety

This phase continues from the Phase 2 source and keeps the existing unified LawyerProfile, controlled category/location metadata, auth, search-ranking and pagination architecture.

## What changed

### Manual Search UX

- Area of Practice no longer displays "(optional)". Preferred Location keeps the optional label.
- The wording is shorter and avoids repeating the same search rules in several places.
- Area select, location autocomplete and More Filters now use the same chevron style.
- Search actions use the same yellow primary-action styling.
- If a user changes any filter after a search, an amber status message appears: "Filters changed. Search again to update the results."
- The search button changes to "Update Results" while there are unapplied changes.
- Existing results stay visible until the user explicitly searches again, avoiding unnecessary API calls.
- Pagination is disabled while filters have unapplied changes. This prevents page navigation from accidentally discarding or applying edits.
- Clear filters now clears both the controls and the old search results instead of leaving stale results on the right.

### Navigation and scroll behavior

- Route changes scroll to the top before paint using a global ScrollToTop component.
- Applying an Advanced Search suggestion also explicitly scrolls to the top because it changes search mode inside the same route rather than navigating to a different pathname.

### Advanced Search flow

The flow is now:

```text
User description
  -> local input guard
  -> AI rate limits
  -> DeepSeek structured classification
  -> backend category whitelist validation
  -> backend location validation
  -> suggestion UI
  -> Apply and Search
  -> Manual Search
  -> automatic lawyer search
```

A valid suggestion can return:

- one primary controlled legal category;
- up to two controlled alternatives;
- a short explanation of why the category matches;
- one validated location when exactly one configured city is identified.

The AI never chooses a specific lawyer. It only routes the description into the controlled search taxonomy.

### Multilingual behavior

The prompt explicitly handles:

- English;
- Sinhala script;
- Romanized Sinhala / Singlish;
- Tamil script;
- Romanized Tamil;
- mixed-language descriptions.

Reasoning/explanation rules:

- English input -> English explanation
- Sinhala script -> Sinhala explanation
- Singlish -> Romanized Sinhala explanation in Latin letters
- Tamil script -> Tamil explanation
- Romanized Tamil -> Romanized Tamil explanation in Latin letters
- mixed language -> English explanation

### Unclear and irrelevant input

Advanced Search now separates three model statuses:

```text
valid
unclear
irrelevant
```

Random/gibberish input should be shown as unclear rather than presenting "Other" as a confident result.

Clearly unrelated content should be shown as irrelevant.

Obvious code or markup is rejected locally before the DeepSeek completion call.

### AI security layers

This phase adds multiple independent controls:

1. Minimum and maximum description length checks.
2. Unicode-aware readable-text checks.
3. Repeated-noise detection.
4. Obvious code/markup rejection before the paid AI call.
5. User content is sent as a separate user message, not merged into system instructions.
6. System instructions explicitly treat user text as untrusted data and ignore prompt-injection instructions.
7. The prompt receives the exact active category IDs from MongoDB.
8. DeepSeek JSON Output is requested.
9. Model output is parsed and validated on the server.
10. Unknown/invented category IDs cannot be applied.
11. AI-proposed locations are accepted only if they match an active controlled Location record.
12. The server does not return raw model output.
13. The server does not cache Advanced Search responses.
14. Raw user descriptions are not logged by this implementation.
15. AI requests have a 25-second timeout.
16. The server retries once only when a model response cannot be parsed as valid JSON.
17. DeepSeek thinking mode is disabled for this classification task to reduce unnecessary latency/cost.
18. AI burst limit: 10 requests per minute per connection.
19. AI longer limit: 60 requests per hour per connection.

The rate limiter is deliberately based on request volume rather than punishing users because an AI model labeled one request as irrelevant. A model classification can be wrong; automatically locking a legitimate user based on that classification would be unreliable. Repeated abusive requests are still limited by the burst/hour limits.

### DeepSeek model configuration

Use:

```env
DEEPSEEK_API_KEY=your_real_key
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-v4-flash
```

The code also maps the older `deepseek-chat` value to `deepseek-v4-flash` as a compatibility safeguard, but the local `.env` should be updated to the current model name.

## Files added

```text
client/src/components/ui/ChevronDownIcon.jsx
client/src/components/ui/SelectControl.jsx
server/src/services/aiInputGuardService.js
AI_TEST_SCENARIOS.md
README-PHASE3.md
```

## Files changed

```text
client/src/components/navigation/ScrollToTop.jsx
client/src/features/search/components/AdvancedSearchPanel.jsx
client/src/features/search/components/LocationAutocomplete.jsx
client/src/features/search/components/ManualSearchPanel.jsx
client/src/features/search/components/SearchModeTabs.jsx
client/src/pages/FindLawyersPage.jsx
client/src/pages/HomePage.jsx
server/.env.example
server/src/app.js
server/src/controllers/aiController.js
server/src/services/aiClassificationService.js
```

## Installation

No new npm package is required for this phase.

Extract the replacement ZIP into the FindMyLawyer project root and allow matching files to be overwritten. Keep your real `.env` files.

Restart the server and client afterward.

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

## Validation performed in the build environment

- Every server-side JavaScript file passed `node --check`.
- All 28 frontend JavaScript/JSX files were syntax-parsed with the TypeScript compiler using JSX preserve mode and no dependency resolution.
- The input guard was exercised with normal English, Sinhala, Singlish, code/markup and repeated-noise examples.
- A full Vite build could not be completed in the sandbox because dependency installation did not complete, so run the normal client build locally as the final environment check:

```powershell
cd client
npm run build
```

## Testing

See `AI_TEST_SCENARIOS.md` for English, Sinhala, Singlish, Tamil, mixed-language, ambiguous, irrelevant, prompt-injection, code-input and Manual Search scenarios with expected outcomes.
