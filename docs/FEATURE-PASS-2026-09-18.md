# FindMyLawyer Feature Pass — 18 September 2026

This pass builds on commit `5134d95` (`Stabilize verification and frontend integration`). It intentionally keeps the existing single lawyer/search/auth architecture and adds three tightly related improvements without introducing a second source of truth.

## 1. Explicit guest Saved Lawyers merge consent

Device-level guest saves are no longer merged into a client account merely because somebody logs in.

Current flow:

```text
Guest saves on this device
        +
client logs in
        ↓
load client account saves only
        ↓
show blocking merge confirmation
       / \
Keep separate   Merge
     ↓            ↓
leave device     union-sync on server
saves intact     ↓
                 clear guest IDs only after success
```

The modal identifies the signed-in account and explains the shared-device risk. `Keep separate` applies to the current authenticated session only; after a later logout/login the user is asked again if guest saves still exist. Account saves are never copied into guest localStorage.

The existing backend `/api/saved-lawyers/sync` remains the canonical union operation and still validates public lawyer IDs and prevents duplicates.

## 2. Development profile images

Real lawyer profiles now support a profile photo stored locally for development.

- JPEG, PNG and WebP only.
- Maximum 4 MB.
- The server verifies the file signature instead of trusting the browser MIME label alone.
- Generated filenames use UUIDs; user filenames are never used as paths.
- Files live under `server/uploads/profile-images/`.
- The folder is git-ignored except for `.gitkeep`.
- Upload and removal require an authenticated lawyer account.
- Upload parsing happens after authentication and a per-lawyer rate limit.
- Replacing/removing an image cleans up the previous generated file after the database state is safely updated.
- Public lawyer cards, public profiles, lawyer profile pages and admin lawyer views use the image when available and fall back to initials if the image is missing or fails to load.

This is deliberately a **development-only storage implementation**. A deployed version should replace the local storage service with durable object storage/CDN handling and should consider image re-encoding/metadata stripping.

## 3. Database-backed location administration

The `locations` MongoDB collection is the runtime source of truth for active cities shown by public search, lawyer registration and profile editing. The admin dashboard now includes a Locations section for:

- adding a city;
- editing city/district/province metadata;
- searching/filtering the catalogue;
- archiving a referenced location;
- restoring an archived location;
- hard-deleting an unused location.

Sri Lankan district/province combinations are constrained to the existing catalogue data, which covers 25 districts and 9 provinces. Cities themselves remain database records and are not hardcoded into frontend dropdowns.

### Stable location references

`LawyerProfile` now stores `locationId` in addition to the denormalized city/district/province strings used for display/search compatibility. Existing profiles are backfilled when a canonical match is available.

Admin renames propagate the new canonical strings to current and pending lawyer profile data linked to the location. A location already referenced by lawyer data is archived rather than deleted, protecting historical/profile consistency.

Archived locations are not selectable for new registrations/profile edits or public location filters. A lawyer whose stored location was archived must choose an active location the next time they edit that professional location.

## 4. Admin review hardening and UI cleanup

The admin dashboard was reorganized into clearer Lawyer reviews, Users, Locations and Admin activity sections. The lawyer review experience retains verification document preview/auditing and now avoids several ambiguous states.

Notable corrections:

- approval actions no longer inherit stale rejection text in the activity log;
- the frontend refreshes authoritative backend state after decisions;
- rejection scope is available for real verification rejections but not unrelated profile-update review rejections;
- `Keep pending` is available only for an item that is already pending, preventing an approved/rejected lawyer from being silently moved to pending/unpublished through a stale UI/API request;
- profile images are visible in relevant admin lawyer views;
- location metadata changes are written to the admin activity log.

## 5. Validation added in this pass

Backend tests now also cover profile-image validation and stable `locationId` review behavior. Run:

```powershell
cd server
npm test
```

Then from the client:

```powershell
npm run lint
npm run build
```

## 6. Manual smoke tests

### Saved Lawyers consent

1. Sign out and save two lawyers.
2. Log into a client account that already has saved lawyers.
3. Confirm the account list loads without an automatic merge.
4. Choose `Keep separate`; sign out and confirm the two guest saves remain.
5. Log in again and choose `Merge`.
6. Confirm the union contains no duplicates and the guest list is cleared only after success.

### Profile image

1. Log in as a lawyer and open Edit Profile.
2. Upload JPEG/PNG/WebP under 4 MB.
3. Confirm it appears on the lawyer's own profile and, for published lawyers, public cards/detail pages.
4. Replace it and confirm the old URL/file is no longer used.
5. Remove it and confirm initials return.
6. Try an unsupported/spoofed file and a file over 4 MB; both must be rejected.

### Admin locations

1. Log in as admin and open Locations.
2. Add an unused test city under a valid district/province and confirm it appears in public location controls.
3. Rename it and confirm the new name is returned.
4. Delete the unused test city; it should be removed.
5. Edit a location used by a lawyer; linked canonical profile strings should update atomically.
6. Remove a referenced location; it should become Archived rather than being hard-deleted.
7. Confirm archived locations disappear from public selectors.
8. Restore it and confirm it is selectable again.
