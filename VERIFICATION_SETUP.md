# Lawyer verification setup

FindMyLawyer uses one active lawyer-verification architecture based on the `Verification`, `VerificationFile`, and `VerificationViewLog` models.

Verification documents are private. They are not included in public lawyer-profile responses and must never be copied into demo/public datasets.

## Workflow

1. A lawyer registers and opens `/lawyer/verification`.
2. They submit a Supreme Court enrolment number plus:
   - one enrolment certificate PDF, and
   - either NIC front + back (JPG/PNG) or one passport identity-page image (JPG/PNG).
3. Each file is limited to **3 MB** and is validated by declared MIME type plus basic magic bytes before storage.
4. An admin reviews the lawyer profile and the submitted files from `/admin`.
5. The admin can approve the lawyer or request changes.
6. When requesting changes for a new/unpublished lawyer, the admin records whether the correction applies to:
   - `profile` — profile details only;
   - `documents` — verification documents only; or
   - `both` — profile details and verification documents.
7. Profile-only corrections return to the admin queue after the lawyer updates the professional profile. Document/both corrections remain rejected until corrected verification files are explicitly resubmitted.
8. Approved existing lawyers can submit material profile changes without taking the currently approved public profile offline. Those pending profile changes are reviewed separately from the already-approved verification documents.

## Storage

The active implementation stores:

- verification metadata/submission history in the `verifications` collection;
- private file bytes in the `verificationfiles` collection;
- verification-file access records in the `verificationviewlogs` collection;
- broader profile/admin actions in the `activitylogs` collection.

The previous GridFS-based verification implementation is no longer active. Compatibility marker files remain at a few old paths so extracted updates cannot accidentally leave a second working verification architecture behind.

## Routes

### Lawyer

- `GET /api/lawyers/me/verification` — get the logged-in lawyer's verification state and submission metadata.
- `POST /api/lawyers/me/verification` — create the first submission or resubmit corrected documents after a document/both rejection.
- `GET /api/lawyers/:lawyerId/verification/submissions/:submissionId/files/:fileId` — authenticated lawyer access to one of their own submitted documents.

### Admin

- `GET /api/admin/lawyers` — list real registered lawyer profiles with their effective review status.
- `GET /api/admin/lawyers/:id/verification` — get verification/submission metadata for a lawyer.
- `GET /api/admin/lawyers/:lawyerId/verification/submissions/:submissionId/files/:fileId` — view a private verification document; access is logged.
- `PATCH /api/admin/lawyers/:id/decision` — save `pending`, `approved`, or `rejected`; rejected new-lawyer decisions may include `rejectionScope` (`profile`, `documents`, or `both`).
- `GET /api/admin/lawyers/:id/activity` — review lawyer/profile activity history.

## Request-size and abuse protection

Normal JSON requests use a small global body limit. The larger verification-upload parser is attached only to the authenticated lawyer verification POST route, after authentication/role checks and a dedicated upload rate limiter. This prevents unauthenticated users from forcing the API to parse large verification payloads.

The verification upload request is allowed up to 13 MB because Base64 encoding increases the JSON payload size. Individual decoded files remain limited to 3 MB.

## Consistency

Verification submission writes and admin verification decisions use MongoDB transactions so related profile, verification, file, and activity-log updates commit together or roll back together.

This requires MongoDB transaction support (for example MongoDB Atlas or a replica set). The project's normal Atlas development setup supports this.

## Document access audit

Every successful verification-file view first writes a `VerificationViewLog` entry containing the authenticated actor, actor role, lawyer, submission, file, and document slot. The server fails closed if that audit record cannot be written, so a sensitive verification document is not silently returned without an access record.

A browser can still capture any document it is permitted to display. Audit logging and authenticated access reduce risk but cannot provide screenshot prevention.

## Production hardening still required

Before treating this prototype as a production identity-verification system, define and implement at least:

- identity-document retention/deletion rules;
- administrator access revocation procedures;
- malware/virus scanning and deeper PDF/image inspection;
- independent verification of Supreme Court enrolment details using an authorised source;
- appropriate privacy/legal review for storing identity documents;
- backup/restore rules that keep verification documents private.

MIME checks and magic-byte validation establish only basic file-format consistency. They do not prove that a document is safe, genuine, or belongs to the applicant.
