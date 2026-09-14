# Lawyer verification setup

This update adds a separate private document step after lawyer registration. It uses MongoDB GridFS through the MongoDB driver already included with Mongoose, so it adds no npm dependencies. Keep the `verificationFiles.files`, `verificationFiles.chunks`, `lawyerverifications`, and `verificationviewlogs` collections private; do not copy them into public datasets.

## Workflow

1. A lawyer signs up, then opens `/lawyer/verification` from registration or their dashboard.
2. They supply their Supreme Court enrolment number, upload one certificate PDF (up to 8 MB), and choose either NIC (front and back, each JPG/PNG) or passport (identity-page JPG/PNG). They click Submit for review.
3. An admin signs in, opens `/admin`, selects Lawyer applications or All lawyers, reviews the submitted files, and manually checks enrolment and identity. The admin records both confirmations or requests corrected documents with a reason.
4. Only after document verification can the admin approve and publish the lawyer profile. Existing lawyer profiles with no verification record cannot be newly approved until they submit documents.

## Routes

- `GET /api/lawyers/me/verification`: lawyer's own status and upload flags.
- `PUT /api/lawyers/me/verification/documents/:kind`: lawyer-only raw PDF/JPEG/PNG upload with the actual MIME type in `Content-Type`; allowed kinds are `certificate`, `nicFront`, `nicBack`, and `passport`.
- `POST /api/lawyers/me/verification/submit`: enrolment number and identity choice.
- `GET /api/admin/lawyers?status=all&page=1`: paginated registered lawyers, excluding demo profiles.
- `GET /api/admin/lawyers/:id/verification`: admin-only status and upload flags.
- `GET /api/admin/lawyers/:id/verification/documents/:kind`: admin-only document stream, logged per view.
- `PATCH /api/admin/lawyers/:id/verification`: `verify` requires independent confirmation of enrolment and identity; `request_changes` requires a note.

## Important limitation

The admin page has no Download button and its server route requires admin authentication, but any admin who can view a PDF or image in a browser can also capture it with a screenshot, camera, browser tools, or print controls. The visible watermark and access log discourage copying but cannot prevent it. Do not promise screenshot prevention to applicants. A native PDF viewer may still offer print or save controls even when the toolbar is hidden.

Before production use, define a retention schedule for identity documents and access logs, a process to revoke admin access, virus scanning or deeper PDF inspection, and independent enrolment verification with an authorised source. MIME and magic-byte checks alone do not establish that an uploaded document is safe or genuine. Test with synthetic documents first and confirm your MongoDB storage allowance. Documents are never part of a public profile response.
