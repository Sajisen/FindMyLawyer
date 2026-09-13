# FindMyLawyer — Phase 2 Search, Pagination, Metadata and Advanced Search

This update is designed to be extracted over the Phase 1 project version.
The folder structure is already correct, so overwrite the matching files when
extracting the patch ZIP at the project root.

## What this phase changes

### Manual Search

- Area of Practice and Preferred Location are now the two **main search inputs**.
- A search can run with:
  - Area of Practice only;
  - Preferred Location only; or
  - both together.
- More Filters are unavailable until at least one main input is selected.
- The backend also enforces this rule, so a request containing only language,
  experience, consultation mode, etc. cannot retrieve the whole lawyer list.
- Location-only searches stay inside the selected province and rank:
  1. exact city;
  2. same district;
  3. same province.
- Area + Location searches retain the useful Online fallback after the nearby
  category matches.

### Pagination

- Search results are paginated server-side.
- Default page size is 10.
- The API supports `page` and `limit` (maximum limit 50).
- Pagination changes only the search-results component through React Router
  query parameters; it does not perform a browser page reload.

### Controlled legal categories and locations

Two new MongoDB collections are introduced:

- `legalCategories`
- `locations`

They are now the controlled metadata source used by public search and Advanced
Search.

On backend startup, the system automatically bootstraps them **only if the
collections are empty**:

- legal categories come from the initial controlled category seed;
- locations are copied once from the existing fictional/demo lawyer dataset.

After that, location suggestions are read from `locations`, not dynamically
from lawyer profile strings. This prepares the system for a future admin UI
that can add/deactivate canonical locations without trusting free-typed lawyer
profile values.

`npm run seed:meta` is included as a development reset utility. It deletes and
recreates the controlled category/location metadata, so do not use it later if
real admin-managed metadata must be preserved.

### Advanced Search / DeepSeek

Advanced Search is now connected to the backend.

Flow:

1. User writes a description.
2. `POST /api/ai/classify` sends the description to the configured DeepSeek API.
3. The prompt contains the **exact active category IDs from MongoDB**.
4. The model must return only controlled category IDs.
5. The server validates the response again and rejects/normalizes anything that
   is outside the configured taxonomy.
6. The UI shows the best category and up to two possible alternatives.
7. User chooses a suggestion and clicks **Apply to Search**.
8. Manual Search receives only:
   - the selected category; and
   - an optional validated location.
9. Other filters are never invented by AI.

Location extraction is intentionally safer than asking the model to invent a
place. The backend compares the description against the controlled `locations`
collection. A location is suggested only when exactly one configured city is
explicitly mentioned. If several cities are mentioned, no location is applied
automatically.

The AI feature is search routing only and does not provide legal advice, case
predictions or lawyer-quality rankings.

### Navigation and favicon

- Route changes now scroll to the top of the destination page.
- Query-string-only pagination does not trigger the global top scroll.
- The browser favicon now uses the existing FindMyLawyer icon asset instead of
  the old default/white SVG.

## Environment

Your existing real `.env` file is not included in the ZIP and should not be
overwritten.

The backend supports:

```env
DEEPSEEK_API_KEY=your_real_key
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

`DEEPSEEK_API_URL` and `DEEPSEEK_MODEL` are optional if the defaults are valid
for your DeepSeek account. If your existing `.env` already has a specific
supported model, the application uses that value.

## How to apply

1. Stop the frontend and backend dev servers.
2. Extract the Phase 2 patch ZIP into the FindMyLawyer project root.
3. Allow the matching files to be overwritten.
4. Keep your existing `server/.env` and `client/.env` files.
5. Restart the backend:

```powershell
cd server
npm run dev
```

On the first restart you should see search-metadata bootstrap messages if the
new collections did not already exist.

6. Restart the frontend:

```powershell
cd client
npm run dev
```

No new npm dependency was added in this phase.

## Important tests

### Main-filter rules

- Practice Area only -> search works.
- Location only -> search works.
- No Practice Area and no Location -> Find Lawyers stays disabled.
- No main filter -> More Filters stays disabled.
- Select a category -> More Filters becomes available.
- Select a location -> More Filters becomes available.

### Location-only ordering

Choose a configured city and search without a category. Confirm the order is:

```text
Exact city
Same district
Same province
```

There should be no nationwide Online-only fallback in a location-only search.

### Category + location

Choose both. Confirm nearby lawyers in that legal category appear before Online
alternatives.

### Pagination

Use a search with more than 10 results. Confirm:

- only 10 cards are rendered per page;
- Previous / page numbers / Next work;
- the whole browser page does not reload;
- the URL tracks the result page.

### Location input

- Type a city prefix.
- Choose the city from the controlled suggestions.
- If text is typed but no suggestion is selected, the UI asks the user to
  select a configured location before searching.

### Home page

- Search using category only.
- Search using location only.
- Search using both.
- Click a Common Legal Area card from lower on the Home page and confirm the
  Find Lawyers page opens at the top.

### Advanced Search

Try a description with no location, for example a family/legal dispute. Confirm
that a controlled category is suggested and no other filters are invented.

Then try a description containing one configured city such as `Panadura`.
Confirm the location is shown as a suggestion and is applied only after the
user clicks Apply to Search.

Try a description mentioning two configured cities. The backend should avoid
choosing between them automatically.

## Files changed/added

```text
client/index.html
client/public/findmylawyer-icon.png
client/src/main.jsx
client/src/components/navigation/ScrollToTop.jsx
client/src/pages/HomePage.jsx
client/src/pages/FindLawyersPage.jsx
client/src/features/lawyers/components/LawyerCard.jsx
client/src/features/lawyers/components/Pagination.jsx
client/src/features/lawyers/lawyerApi.js
client/src/features/search/advancedSearchApi.js
client/src/features/search/searchMetaApi.js
client/src/features/search/hooks/useLegalCategories.js
client/src/features/search/components/LocationAutocomplete.jsx
client/src/features/search/components/ManualSearchPanel.jsx
client/src/features/search/components/AdvancedSearchPanel.jsx

server/.env.example
server/package.json
server/src/app.js
server/src/server.js
server/src/data/defaultLegalCategories.js
server/src/models/LegalCategory.js
server/src/models/Location.js
server/src/controllers/metaController.js
server/src/controllers/lawyerController.js
server/src/controllers/aiController.js
server/src/routes/metaRoutes.js
server/src/routes/aiRoutes.js
server/src/services/searchMetadataService.js
server/src/services/lawyerSearchService.js
server/src/services/aiClassificationService.js
server/src/scripts/seedSearchMetadata.js
```

## Intentionally not changed yet

The existing lawyer registration/profile-editing frontend is not refactored in
this phase. The new metadata collections provide the correct source of truth for
that future work, but the teammate-owned auth/registration area is left alone
until it is ready to integrate. At that stage, lawyer registration/profile
editing should use controlled category IDs and selected location IDs rather
than accepting arbitrary free text.
