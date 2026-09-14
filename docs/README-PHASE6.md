# FindMyLawyer Phase 6

## Search result presentation, navigation restoration and account/profile workflow

This phase continues from Phase 5 and focuses on making lawyer discovery feel like a complete product rather than a collection of separate pages.

## Main changes

### Search result views

The Find Lawyers result area now supports two layouts:

- List view for detailed comparison.
- Grid view with two profile cards per row on suitable desktop/tablet widths.

The selected layout is remembered locally so changing pages or visiting a lawyer profile does not unexpectedly reset the user's preferred layout.

The lawyer cards were also refined so the profile action no longer dominates each result as a large black button. The primary actions now use the FindMyLawyer yellow/neutral visual language.

### Return-to-search state restoration

Opening a lawyer profile from search records a short-lived search return state in `sessionStorage`.

The stored state contains:

- the exact search URL, including pagination;
- the current scroll position;
- any edited but not-yet-applied filter values;
- the active Manual/Advanced Search tab;
- Advanced Search text;
- the current result layout.

When the user returns to the search page, the actual lawyer results are fetched again from the backend using the URL as the source of truth. After the asynchronous results are ready, the previous scroll position is restored.

This means a user can open a lawyer from page 3, return, and continue from approximately the same place instead of being sent to page 1 or the top of the result list.

Browser Back/Forward navigation is also no longer force-scrolled to the top. New page navigations still begin at the top.

### Public lawyer profile

The public lawyer detail page now gives more visual importance to the lawyer identity/photo area. A larger initials placeholder is used until profile-image upload support is added later.

The page keeps direct contact information, professional details, practice areas, focus areas and save functionality while using a cleaner visual hierarchy.

### Navigation

The desktop navigation no longer keeps `Saved` as a central text navigation item. Saved Lawyers is represented by a heart icon on the right with a count badge for guest/client users.

Logged-in users now have an account/profile control on the right. It provides:

- Profile
- Admin panel for administrators
- Sign out

Lawyer and client profile access therefore remains available without continuously adding more top-level navigation words.

### User profiles

A new `/profile` route acts as the account profile entry point.

Client accounts can:

- see their account information;
- edit their account name;
- see their saved-lawyer count;
- open Saved Lawyers.

Administrator accounts can also open their account profile and navigate to the Admin panel.

Lawyer accounts use the same `/profile` entry point but receive their professional lawyer profile interface.

Legacy routes `/lawyer` and `/lawyer/edit-profile` redirect to the new profile routes so existing links do not break.

### Lawyer sign-in behavior

A lawyer signing in normally is now sent to Home instead of being forced directly into a dashboard/profile page.

The profile is available from the account menu whenever the lawyer wants to manage it.

The word `Dashboard` was removed from the lawyer-facing interface. The lawyer area is presented as `Your lawyer profile`.

### Lawyer profile update review workflow

Approved lawyers can edit their profile without their currently approved public data disappearing while a material change is being reviewed.

Immediate operational/contact fields:

- public contact email;
- phone;
- languages;
- consultation modes;
- accepting-new-client status.

These can update directly.

Material professional fields require administrator review for an already approved lawyer:

- display name;
- professional title;
- office location;
- primary/additional practice areas;
- focus/sub-areas;
- years of practice;
- public description.

When one of those material values changes:

1. the existing approved profile remains public;
2. the validated proposed values are stored as `pendingProfileChanges`;
3. the Admin panel shows the request as a `Profile update`;
4. the admin can compare current and requested values;
5. approval atomically applies the requested values;
6. rejection discards the proposed values but keeps the previously approved profile public.

This avoids temporarily removing an approved lawyer from public search just because they requested a new practice area or changed another professional detail.

New/unapproved lawyers continue using the existing application review workflow.

### Backend additions

`LawyerProfile` now supports:

- `pendingProfileChanges`
- `pendingProfileChangesSubmittedAt`
- `profileUpdateRejectionReason`

A dedicated `lawyerProfileReviewService.js` controls which validated fields require review and safely applies approved changes.

`PATCH /api/auth/me` now allows a logged-in account to update its name. Account/login email changes are intentionally not implemented in this phase.

## Important design decisions

- Search state continues to live primarily in the URL. Session storage is used only for temporary UI/scroll restoration.
- Public lawyer data never exposes pending unapproved professional changes.
- Pending lawyer changes are validated before being stored.
- Approved profile edits do not require cloning the entire lawyer document or creating a second public profile.
- Public contact email is separate from the account's sign-in email after registration.
- No profile photo upload has been added yet. The UI only reserves a more appropriate visual area for it.

## No new npm packages

Phase 6 does not add a dependency.

## Documentation organization

Phase documentation and test scenario documents belong under the top-level `docs/` folder. `README.md` remains at the project root. If an older local copy still has `AI_TEST_SCENARIOS.md` at the repository root, keep the `docs/AI_TEST_SCENARIOS.md` copy and remove the duplicate root copy before committing.
