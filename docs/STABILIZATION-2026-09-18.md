# Stabilization pass — 18 September 2026

This pass was performed against the 17 September ZIP baseline after `main` had already been merged into `sajitha-dev`.

## Problems addressed

- Fixed the rejected-lawyer flow that could move verification back to `pending` after a profile edit and prevent corrected document uploads.
- Added explicit rejection scopes (`profile`, `documents`, `both`) so the required correction path is unambiguous.
- Made verification submission and admin verification decisions transactional.
- Added verification-document access auditing and fail-closed behavior if the audit write fails.
- Moved the large verification JSON parser behind lawyer authentication and role checks and added a dedicated upload rate limit.
- Standardized the client API environment variable on `VITE_API_BASE_URL` while retaining `VITE_API_URL` as a backward-compatible fallback.
- Changed the admin decision UI to refresh from backend-authoritative state instead of guessing `isPublished` after a decision.
- Replaced the obsolete second verification implementation with extraction-safe compatibility markers/shims so it cannot continue acting as an alternate architecture.
- Replaced the lawyer document popup flow with an inline preview to avoid popup-blocker failures.
- Updated `VERIFICATION_SETUP.md` to match the active implementation.
- Added backend unit tests for the verification state rules and professional-profile review helper logic.

## Verification state rules

For a rejected new/unpublished lawyer:

- `profile`: editing the professional profile returns the application to `pending`; existing verification files are reused.
- `documents`: profile edits do not clear the rejection; corrected verification documents must be resubmitted.
- `both`: profile edits can be saved, but the application remains rejected until corrected documents are also resubmitted.
- older rejected records without a scope are treated as `both`, which is the safer backward-compatible behavior.

For an already-approved/public lawyer, material profile edits continue to use `pendingProfileChanges`; rejecting those edits does not unpublish the already-approved public profile or change the approved verification-document state.

## Validation commands

From `server/`:

```powershell
npm test
```

From `client/`:

```powershell
npm run lint
npm run build
```

The project should still be smoke-tested with real development data for registration, verification submission/resubmission, admin decisions, public visibility, saved lawyers, search, and AI classification before merging to `main`.
