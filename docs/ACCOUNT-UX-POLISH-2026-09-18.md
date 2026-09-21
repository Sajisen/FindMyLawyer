# Account and Navigation UX Polish — 18 September 2026

This pass improves presentation and usability around the account/security flows without changing the underlying authentication architecture.

## Changes

- Added a reusable password input with show/hide controls and consistent focus/disabled states.
- Refined client login and registration to match the public site's premium visual system.
- Refined lawyer registration password controls while preserving the existing registration payload and validation flow.
- Refined the authenticated Sign-in & Security page.
- Added OTP expiry context and resend countdowns to email-change and password-reset flows.
- Added explicit resend/restart controls while continuing to enforce all OTP cooldown and validity rules on the server.
- Refined password recovery into a clearer multi-step flow.
- Added a proper 404 page for unknown frontend routes.
- Added a lawyer Verification shortcut to both desktop and mobile account navigation.
- Replaced the plain protected-route loading message with a consistent loading state.
- Hardened login return navigation so only normal internal paths are honored from route state.

## Security boundaries preserved

- OTP values are never returned to the browser by the API.
- OTP hashes, expiry, attempt limits and cooldown rules remain server-controlled.
- Frontend countdowns are UX only and are not treated as security controls.
- Password/email changes continue to use auth-version session revocation.
- Password-reset requests continue to avoid revealing whether an active account exists.
