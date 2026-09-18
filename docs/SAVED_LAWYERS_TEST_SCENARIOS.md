# Saved Lawyers and Public Profile Test Scenarios

Use these after starting both the server and client.

## 1. Guest save

1. Sign out.
2. Open Find Lawyers and run any search.
3. Click `Save` on one lawyer.
4. The button should become `Saved`.
5. Open `Saved` / `Saved Lawyers` from the navigation.

Expected:

- the lawyer appears once;
- refreshing the browser keeps the lawyer saved;
- browser localStorage contains only lawyer IDs, not full lawyer/contact objects.

## 2. Guest duplicate prevention

1. Save one lawyer.
2. Move between search, detailed profile, and Saved Lawyers.
3. Click save/remove/save as needed.

Expected:

- the same lawyer never appears twice;
- Save state is consistent across search card, detail page, and Saved Lawyers.

## 3. Public lawyer detail page

1. Search for lawyers.
2. Click a lawyer name or `View profile`.

Expected:

- `/lawyers/:id` opens at the top;
- name, title, location, practice areas, languages, consultations, experience, description and contact details render;
- phone uses a `tel:` link;
- email uses a `mailto:` link;
- Save button works;
- Back returns to the originating search URL or Saved Lawyers page.

## 4. Guest to new client registration merge confirmation

1. Sign out.
2. Save lawyers A and B.
3. Register a new client account.
4. Wait for the account saved list to load.

Expected:

- A and B are **not** merged automatically;
- a modal names the signed-in account and explains that 2 lawyers were saved on this device while signed out;
- choosing `Keep separate` closes the modal, leaves A and B in guest localStorage, and shows only the account's server-side saves while signed in;
- after signing out, A and B are still available to the guest on that device.

Repeat, then choose `Merge into <account name>`.

Expected:

- A and B are union-merged into the account;
- local guest storage is cleared only after the successful sync;
- refreshing while signed in still shows the merged account list.

## 5. Existing client union merge with confirmation

Prepare an account that already has A, B and C saved.

1. Sign out.
2. As a guest save B, D and E.
3. Sign back into that client account.
4. Confirm the merge in the modal.

Expected account result:

```text
A, B, C, D, E
```

There must be no duplicate B and no existing account save may be removed. Before the user confirms, the account list must remain A, B and C only.

## 6. Logout, keep separate, and later merge

1. Sign in as a client and confirm account saves exist.
2. Sign out.
3. Save a different lawyer X as a guest.
4. Sign back into the same client account.
5. Choose `Keep separate`.
6. Sign out again and confirm X is still present for the guest.
7. Sign back into the client account and choose `Merge`.

Expected:

- the modal is offered again on the new login session;
- existing account saves remain;
- X is added only after explicit confirmation;
- no duplicates appear;
- account-only saves are never copied into guest localStorage.

## 7. Different client account safety

1. Sign in as Client A and save some lawyers.
2. Sign out.
3. Do not save anything as a guest.
4. Sign in as Client B.

Expected:

- Client A's account-only saves are not copied into Client B;
- each account retains its own server-side list.

## 8. Invalid localStorage IDs

Manually add an invalid/nonexistent ID to the guest Saved Lawyers localStorage array, then refresh.

Expected:

- the application does not crash;
- invalid/unavailable IDs are not displayed;
- the backend never trusts the browser value as a lawyer record.

## 9. Unpublished lawyer protection

For a real lawyer profile, make it non-public from the backend/admin workflow after it has been saved by a client.

Expected:

- the lawyer no longer appears in public search/profile/Saved Lawyers;
- the public API does not expose the unpublished profile.

## 10. Lawyer registration controlled location/category

1. Open lawyer registration.
2. Type a random/nonexistent city without selecting a suggestion.
3. Submit.

Expected:

- registration is blocked.

Then select a real city suggestion and legal category and submit valid details.

Expected:

- profile uses the controlled city/district/province;
- lawyer account is created as unpublished/pending.

## 11. Rejected lawyer resubmission

1. Admin rejects a pending lawyer with a reason.
2. Sign in as that lawyer.
3. Edit/correct and save the profile.
4. Sign in as admin.

Expected:

- the rejection reason is cleared after the lawyer resubmits;
- the lawyer reappears in Pending Applications;
- profile remains non-public until approved again.

## 12. Role protection

Try account Saved Lawyers API calls with a lawyer/admin token.

Expected:

```text
403 Forbidden
```

Try without a token.

Expected:

```text
401 Authentication required
```

### Temporary profile availability must not destroy guest saves

1. As a guest, save a real published lawyer.
2. As an admin, temporarily disable that lawyer account.
3. Refresh the guest browser.
4. The disabled lawyer should not be displayed as a public saved profile, but its raw device save must remain in localStorage.
5. Re-enable the lawyer and refresh the guest browser.
6. The lawyer should appear in Saved Lawyers again.
7. If the guest logs into a client while the lawyer is disabled and chooses Merge, only server-confirmed synchronized IDs should be removed from guest storage; the unavailable ID must remain on the device for a later retry.
