# Phase 6 Test Scenarios

Run these after replacing the Phase 6 files and restarting the client/server.

## 1. List and grid result views

1. Open Find Lawyers.
2. Search for Criminal Law.
3. Confirm List view initially renders normal full-width cards.
4. Select the Grid icon.
5. Confirm two cards appear per row on a suitable desktop width.
6. Refresh the browser.
7. Confirm Grid view remains selected.
8. Switch back to List view.

Expected: switching layouts does not trigger another lawyer API search and does not change the selected filters.

## 2. Back-to-search pagination and scroll restoration

1. Search for a category with multiple result pages.
2. Go to page 2 or later.
3. Scroll down within the page.
4. Open a lawyer profile.
5. Use the in-page Back to lawyer search button.

Expected:

- the same filters remain selected;
- the same page number remains active;
- the results are fetched from the backend again;
- after results load, the page returns close to the previous scroll position.

Repeat using the browser Back button.

## 3. Pending filter changes survive profile navigation

1. Run a search.
2. Change one filter but do not press Update Results.
3. Confirm the `Filters changed` reminder appears.
4. Open one of the currently displayed lawyer profiles.
5. Return to search.

Expected:

- the old applied results return;
- the newly edited, unapplied filter value is still in the control;
- the pending-change reminder remains;
- pressing Update Results applies it normally.

## 4. Public lawyer profile

Open a lawyer profile and verify:

- large identity/photo placeholder area;
- lawyer name/title/location;
- save control;
- primary/additional practice areas;
- About section;
- focus areas when available;
- clickable phone (`tel:`) and email (`mailto:`);
- experience, languages, consultation modes and availability.

## 5. Client profile

1. Sign in as a client.
2. Open the profile control in the navbar.
3. Select Profile.
4. Edit the account name.
5. Save.
6. Refresh.

Expected: the updated name remains and is reflected in the navbar account control.

Confirm the sign-in email is displayed but not editable.

## 6. Lawyer login destination

1. Sign out.
2. Sign in as a lawyer using the normal Sign in link.

Expected: the lawyer lands on Home, not a dashboard/profile page.

Open the navbar account menu and choose Profile.

Expected: the lawyer sees `Your lawyer profile`.

## 7. Immediate lawyer contact/preference edit

Precondition: use an already approved lawyer.

1. Open Profile > Edit profile.
2. Change only public contact email, phone, languages, consultation modes or accepting-new-client status.
3. Save.

Expected:

- the change saves immediately;
- no new pending professional review is created when material fields are unchanged;
- the lawyer remains publicly visible.

## 8. Approved lawyer material update

Precondition: use an already approved lawyer.

1. Record the lawyer's currently public primary practice area.
2. Open Profile > Edit profile.
3. Add/change a practice area, office location, experience, title, display name, focus area or About text.
4. Save.
5. Open the lawyer's public profile in another tab/session.

Expected:

- the old approved public information remains visible;
- the lawyer profile page says the update is awaiting review;
- the proposed professional value is not public yet.

## 9. Admin approves a profile update

1. Sign in as admin.
2. Open Admin panel > Lawyer reviews.
3. Locate the entry marked `Profile update`.
4. Open Review details.

Expected: a comparison shows Current and Requested values.

5. Approve update.
6. Reload the public lawyer profile.

Expected: the requested professional changes are now public and the pending update is gone.

## 10. Admin rejects a profile update

1. Submit another material change from an approved lawyer.
2. In Admin panel reject it with a reason.
3. Return to that lawyer's profile account.

Expected:

- the rejection reason is visible to the lawyer;
- the previously approved public profile remains active;
- the rejected proposed value is not public.

## 11. New lawyer application regression

1. Register a new lawyer.
2. Confirm normal registration lands on Home.
3. Open Profile.
4. Confirm status is Pending approval.
5. As admin, approve the new application.

Expected: the new lawyer becomes public as before.

Also test rejection, lawyer correction and resubmission.

## 12. Navbar behavior

Guest:

- Home and Find Lawyers remain central.
- Saved Lawyers is the heart icon on the right.
- Sign in/Register remain available.

Client:

- Saved icon shows the count.
- Account menu contains Profile and Sign out.

Lawyer:

- account menu contains Profile and Sign out;
- no client Saved control is shown.

Admin:

- account menu contains Profile, Admin panel and Sign out.
