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

---

## Account security additions (18 Sep 2026)

These scenarios apply after the account-security feature pass.

### Authenticated email change

1. Sign in as a client, lawyer, or admin.
2. Open **Sign-in & security**.
3. Enter a different unused email and the correct current password.
4. Confirm a six-digit `[DEV OTP] EMAIL CHANGE` code appears only in the server terminal.
5. Enter a wrong code and confirm it is rejected without changing the account email.
6. Enter the correct code and confirm the account email changes.
7. Confirm the current browser remains signed in.
8. Confirm another browser/session using the old JWT is rejected and must sign in again.
9. For a lawyer, confirm the public contact email did not change automatically.

### Email-change safety

- Current password wrong -> request rejected.
- New email equals current email -> rejected.
- New email already used by another account -> rejected.
- Six-digit code expires -> rejected and a new code is required.
- Five wrong OTP attempts -> challenge becomes unusable.
- Immediate resend during the cooldown -> rejected.

### Authenticated password change

1. Enter the current password and a different password of at least 8 characters.
2. Confirm the update succeeds and the current browser remains signed in.
3. Confirm another existing session is revoked.
4. Confirm the old password can no longer be used to sign in.
5. Confirm the new password signs in successfully.

### Forgot password

1. Sign out and select **Forgot password?** from Login.
2. Enter a registered active email.
3. Confirm `[DEV OTP] PASSWORD RESET` appears in the server terminal.
4. Enter the OTP and a new password.
5. Confirm reset succeeds and the user can sign in with the new password.
6. Confirm previously issued JWTs are no longer valid.
7. Repeat with a nonexistent email and confirm the browser response does not explicitly reveal that the account does not exist.

### Admin account status

1. Admin -> Users -> Clients: disable a client and confirm they cannot sign in/use an existing session.
2. Re-enable the client and confirm they can sign in again.
3. Disable an approved lawyer and confirm their public profile/search result disappears without losing approval state.
4. Re-enable the lawyer and confirm public eligibility returns.
5. Confirm the currently signed-in admin cannot disable themselves.
6. Confirm the final active administrator cannot be disabled.
7. Confirm the Admin activity tab records account status changes.
