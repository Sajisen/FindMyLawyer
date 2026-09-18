# FindMyLawyer Account Security — 18 September 2026

## Scope

This update adds a complete local-development account-security flow for all FindMyLawyer account roles.

Implemented:

- authenticated sign-in email change;
- short-lived OTP verification for email change;
- authenticated password change;
- forgot/reset-password OTP flow;
- hashed OTP records stored temporarily in MongoDB;
- MongoDB TTL cleanup for expired OTPs;
- verification attempt limits and resend cooldowns;
- development OTP delivery through the server terminal;
- JWT/session revocation after security-sensitive changes;
- admin account enable/disable controls;
- disabled-lawyer removal from public discovery without destroying approval state.

## Development OTP delivery

The project does not yet send real email. In local development the server prints the OTP in the backend terminal.

Example:

```text
============================================================
[DEV OTP] EMAIL CHANGE
[DEV OTP] Destination: new-address@example.com
[DEV OTP] Code: 123456
[DEV OTP] Expires: ...
============================================================
```

The OTP is **never returned by the API** and **never stored in plaintext in MongoDB**.

The database stores an HMAC hash tied to the challenge ID. `ACCOUNT_OTP_SECRET` is used when configured; otherwise development falls back to `JWT_SECRET`.

Recommended local `.env` values:

```env
ACCOUNT_OTP_DELIVERY=console
ACCOUNT_OTP_SECRET=
```

For a future deployed version, replace console delivery with a real email provider before enabling these flows in production.

## OTP lifecycle

- Six numeric digits.
- Valid for 10 minutes.
- Five incorrect verification attempts maximum.
- 60-second resend cooldown.
- A newer OTP request invalidates the older challenge for the same user/purpose.
- Successful use removes the related OTP record immediately.
- Exceeded-attempt records are removed immediately.
- Abandoned/expired records have a MongoDB TTL index and are automatically cleaned up. MongoDB TTL cleanup is asynchronous, so controllers also reject/delete expired records during use.

## Email change

Authenticated flow:

```text
Account security
  -> new sign-in email + current password
  -> backend checks current password and email uniqueness
  -> OTP challenge created for new email
  -> OTP appears in server terminal (development)
  -> user enters OTP
  -> email updated transactionally
  -> authVersion incremented
  -> other JWT sessions become invalid
  -> current browser receives and stores a fresh JWT
```

Changing the sign-in email does **not** change a lawyer's public contact email. Those are intentionally separate fields.

## Password change

Authenticated users provide:

- current password;
- new password;
- confirmation in the client UI.

The backend:

- validates the current password;
- requires 8–128 characters;
- rejects reuse of the existing password;
- stores a new bcrypt hash;
- increments `authVersion`;
- removes pending password-reset OTPs;
- returns a fresh JWT for the current browser.

## Forgot password

Public flow:

```text
Login -> Forgot password
  -> enter account email
  -> generic response (does not confirm whether an account exists)
  -> active account receives a terminal OTP in development
  -> enter OTP + new password
  -> password reset transaction
  -> all existing sessions revoked
  -> return to sign in
```

For missing or disabled accounts, the request endpoint deliberately returns a response with the same general shape to reduce account enumeration.

## Session revocation

`User.authVersion` defaults to `0`.

JWTs carry the version used when they were issued. Protected requests reload the current user from MongoDB and compare versions.

The version increments after:

- successful email change;
- authenticated password change;
- forgot-password reset;
- admin disable/re-enable.

This means an old copied JWT stops working after these security-sensitive changes.

Legacy JWTs/users without an explicit version are interpreted as version `0`, preserving compatibility until a security-sensitive change occurs.

## Admin account controls

The Admin dashboard Users area can disable/re-enable registered accounts.

Safety rules:

- an admin cannot disable the admin account currently being used;
- the last active administrator cannot be disabled;
- status changes invalidate existing JWT sessions;
- pending OTP challenges for the target account are removed;
- account status changes are written to the admin activity log;
- roles are not editable through this control.

For lawyers, `LawyerProfile.accountActive` mirrors account availability. Disabling the account hides the real lawyer from public search/profile access while preserving `isPublished`, verification state and approved profile data. Re-enabling restores public eligibility without requiring re-verification.

Saved-lawyer integration also preserves device-level guest IDs for temporarily unavailable profiles. A disabled lawyer is hidden from public saved-profile results, but the local ID is not silently deleted and can reappear after the account is re-enabled. Guest-to-account merge clears only IDs the server confirms were synchronized.

## Routes

Public:

```text
POST /api/auth/password/reset/request
POST /api/auth/password/reset/confirm
```

Authenticated:

```text
POST /api/auth/me/email-change/request
POST /api/auth/me/email-change/verify
POST /api/auth/me/password/change
```

Admin:

```text
PATCH /api/admin/users/:id/status
```

Frontend:

```text
/account-security
/forgot-password
```

## Production note

`ACCOUNT_OTP_DELIVERY=console` is development-only. Do not deploy with OTP values being logged. A future production email provider should replace the delivery function while preserving the challenge/hash/TTL controller flow.
