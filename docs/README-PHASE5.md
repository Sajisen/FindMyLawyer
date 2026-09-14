# FindMyLawyer Phase 5 - Public Profiles and Saved Lawyers

## Scope

Phase 5 was built on top of the merged `main` state that includes Amri's client/lawyer registration, login, lawyer dashboard, and admin dashboard work, together with the existing Manual Search and switchable Gemini/DeepSeek Advanced Search implementation.

The main additions are:

- public detailed lawyer profile pages;
- Saved Lawyers for guests using localStorage;
- persistent Saved Lawyers for registered client accounts using MongoDB;
- automatic guest-to-client saved-list synchronization at login/registration;
- duplicate-safe union merge behavior;
- save/remove controls on search cards and profile pages;
- a Saved Lawyers page;
- controlled lawyer location/category validation during registration/profile editing;
- several integration and workflow fixes discovered while reviewing the merged auth/admin code.

## Saved Lawyers architecture

### Guest users

Guest users save only lawyer IDs in browser localStorage:

```text
findmylawyer.guestSavedLawyers.v1
```

Full lawyer objects are not stored in localStorage. Public profile data is always reloaded from the backend so stale contact/profile information is not trusted from the browser.

### Registered clients

Registered client saves are stored in the `savedLawyers` MongoDB collection using the `SavedLawyer` model:

```text
userId
lawyerId
createdAt
updatedAt
```

A unique compound index on `userId + lawyerId` prevents duplicate saves at database level. Save and synchronization operations also treat duplicate-key races from multiple tabs as idempotent rather than failing the request.

### Login synchronization

When a client logs in or creates a client account:

```text
guest local IDs
       +
existing account saves
       |
       v
POST /api/saved-lawyers/sync
       |
       v
server validates public lawyer IDs
       |
       v
idempotent MongoDB upsert
       |
       v
canonical union result
```

The merge is additive. Existing account saves are never deleted by guest synchronization.

Example:

```text
Account: A, B, C
Guest:   B, D, E
Result:  A, B, C, D, E
```

Guest localStorage is cleared only after a successful server sync. This prevents losing guest data if the network request fails and prevents one account's saved list from leaking into another account on a shared browser.

### Logout behavior

Account saves remain in MongoDB. They are not copied into guest localStorage on logout. A user can then save new profiles as a guest; those new local saves are merged into the account on the next client login.

## Saved Lawyers API

Protected client endpoints:

```text
GET    /api/saved-lawyers
POST   /api/saved-lawyers/sync
POST   /api/saved-lawyers/:lawyerId
DELETE /api/saved-lawyers/:lawyerId
```

Public batch profile lookup used for guest localStorage hydration:

```text
POST /api/lawyers/batch
```

The batch endpoint accepts a bounded list of IDs and returns only currently public lawyer profiles.

## Public lawyer profile

New frontend route:

```text
/lawyers/:id
```

The page reuses the existing public endpoint:

```text
GET /api/lawyers/:id
```

It shows:

- display name and professional title;
- office location;
- primary and additional practice areas;
- focus/sub-areas;
- profile description;
- languages;
- consultation modes;
- years of practice;
- new-client availability;
- phone and email contact information;
- Save/Saved state.

Search cards now expose a clear `View profile` action and the lawyer name is also linked.

## Current auth/registration integration fixes

During the merged-code review, the following issues were addressed:

1. Lawyer registration no longer trusts freely typed province/district/city strings. The user selects a controlled location and the backend derives canonical city, district, and province values.
2. Primary/additional practice areas are validated against active controlled legal categories on the backend.
3. Languages and consultation modes are validated on the backend.
4. Lawyer profile editing uses the same controlled category/location model instead of allowing arbitrary location/category strings.
5. A rejected lawyer who corrects and saves their profile is automatically returned to the pending-review queue. Previously a rejected profile could remain permanently excluded from the admin pending list.
6. `JWT_SECRET` is validated at server startup so registration cannot create a user and then fail only while generating the token.
7. Duplicate registration races return a conflict response instead of an unexplained server error.
8. Moderate login/registration rate limits were added.
9. Admin/lawyer dashboards now display human-readable legal category names instead of raw category IDs where applicable.
10. Admin creation/rejection inputs received additional server-side validation, and authentication middleware loads only the user fields required for authorization.

## New files

```text
client/src/context/SavedLawyersContext.jsx
client/src/features/lawyers/components/SaveLawyerButton.jsx
client/src/features/savedLawyers/savedLawyerApi.js
client/src/pages/LawyerProfilePage.jsx
client/src/pages/SavedLawyersPage.jsx

server/src/controllers/savedLawyerController.js
server/src/middleware/rateLimiters.js
server/src/models/SavedLawyer.js
server/src/routes/savedLawyerRoutes.js
server/src/services/lawyerProfileValidationService.js
server/src/services/publicLawyerService.js
server/src/services/savedLawyerService.js
```

## Important behavior

- Guests and registered clients can save lawyers.
- Lawyer/admin accounts do not use the client Saved Lawyers feature.
- Only public lawyer profiles can be saved or returned.
- Browser-submitted IDs are always validated by the backend before account synchronization.
- Full lawyer records are never trusted from localStorage.
- Removing a saved lawyer is immediate in the UI and persistent for client accounts.
- If a public lawyer becomes unpublished, it is hidden from Saved Lawyers while the saved relationship can remain in the database. It can reappear if the profile is published again.

## Development note about demo reseeding

`npm run seed` recreates demo lawyer documents. Because MongoDB object IDs can change when demo records are recreated, Saved Lawyer references to old demo IDs can become stale after a destructive demo reseed. This is expected development behavior. Normal application use does not reseed the database.
