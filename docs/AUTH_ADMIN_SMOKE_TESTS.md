# Authentication and Admin Smoke Tests

These checks cover the merged authentication/registration/admin work after Phase 5 integration.

## Client registration

1. Open `/register`.
2. Create a new client with a unique email and password of at least 8 characters.

Expected:

- account is created;
- user is automatically signed in as `client`;
- navbar shows `Sign out` and Saved Lawyers remains available;
- admin Clients tab later shows the new client.

Repeat with the same email.

Expected: conflict message stating that an account already exists.

## Client login

1. Sign out.
2. Open `/login`.
3. Enter the registered client credentials.

Expected:

- login succeeds;
- user returns to the requested client page when applicable, otherwise Home;
- if the device has guest Saved Lawyers, a confirmation modal appears; nothing is merged until the client explicitly chooses to merge.

Wrong password expected: `Invalid email or password.`

## Lawyer registration

1. Open `/register-lawyer`.
2. Fill the required account/profile fields.
3. Select office city from the controlled suggestions.
4. Select a legal category from the controlled category list.
5. Submit.

Expected:

- lawyer account is created and signed in;
- lawyer dashboard opens;
- approval state is Pending Approval;
- profile does not appear in public search before admin approval.

## Admin pending approval

1. Sign in with an admin account.
2. Open `/admin`.
3. Review the pending lawyer.
4. Approve it.

Expected:

- lawyer disappears from Pending Applications;
- lawyer becomes visible in public search and public profile endpoint.

## Admin rejection and resubmission

1. Register another lawyer.
2. Reject the application with a reason.
3. Sign in as the rejected lawyer and edit/save the profile.
4. Return to the admin dashboard.

Expected:

- lawyer sees Pending Approval after resubmitting;
- rejection reason is cleared;
- corrected profile appears in Pending Applications again;
- profile remains hidden publicly until approved.

## Protected routes

While signed out, open `/admin` or `/lawyer`.

Expected: redirect to `/login`.

Sign in with the wrong role and attempt the protected route.

Expected: frontend redirects away and backend returns `403` for direct unauthorized API requests.
