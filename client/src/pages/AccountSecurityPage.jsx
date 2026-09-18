import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/useAuth.js";

function Alert({ type = "error", children }) {
  if (!children) return null;

  const className =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : type === "info"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${className}`}>
      {children}
    </div>
  );
}

export default function AccountSecurityPage() {
  const {
    user,
    requestEmailChange,
    verifyEmailChange,
    changePassword,
  } = useAuth();

  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [emailChallenge, setEmailChallenge] = useState(null);
  const [emailCode, setEmailCode] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailNotice, setEmailNotice] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  async function startEmailChange(event) {
    event.preventDefault();
    setEmailBusy(true);
    setEmailError("");
    setEmailNotice("");

    try {
      const result = await requestEmailChange(emailForm);
      setEmailChallenge(result);
      setEmailCode("");
      setEmailNotice(result.message);
    } catch (error) {
      setEmailError(error.message);
    } finally {
      setEmailBusy(false);
    }
  }

  async function finishEmailChange(event) {
    event.preventDefault();
    setEmailBusy(true);
    setEmailError("");

    try {
      const result = await verifyEmailChange({
        challengeId: emailChallenge.challengeId,
        code: emailCode,
      });
      setEmailForm({ newEmail: "", currentPassword: "" });
      setEmailChallenge(null);
      setEmailCode("");
      setEmailNotice(result.message);
    } catch (error) {
      setEmailError(error.message);
    } finally {
      setEmailBusy(false);
    }
  }

  async function submitPasswordChange(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordNotice("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordBusy(true);

    try {
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordNotice(result.message);
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-background">
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
            Account security
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
            Sign-in and security
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted sm:text-base">
            Manage the email used to sign in and update your password. Security-sensitive changes revoke your other signed-in sessions.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-muted">
            Sign-in email
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-brand-black">Change email</h2>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Current email: <span className="font-semibold text-brand-black">{user?.email}</span>
          </p>

          <div className="mt-5 space-y-3">
            <Alert>{emailError}</Alert>
            <Alert type="success">{emailNotice}</Alert>
          </div>

          {!emailChallenge ? (
            <form onSubmit={startEmailChange} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-brand-black">
                New email address
                <input
                  type="email"
                  required
                  value={emailForm.newEmail}
                  onChange={(event) =>
                    setEmailForm((old) => ({ ...old, newEmail: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
                />
              </label>
              <label className="block text-sm font-semibold text-brand-black">
                Current password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={emailForm.currentPassword}
                  onChange={(event) =>
                    setEmailForm((old) => ({ ...old, currentPassword: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
                />
              </label>
              <button disabled={emailBusy} className="w-full rounded-xl bg-brand-yellow px-5 py-3 text-sm font-extrabold text-brand-black disabled:opacity-60">
                {emailBusy ? "Creating code..." : "Verify new email"}
              </button>
              <p className="text-xs leading-5 text-brand-muted">
                Development mode currently prints the verification OTP in the server terminal instead of sending an email.
              </p>
            </form>
          ) : (
            <form onSubmit={finishEmailChange} className="mt-5 space-y-4">
              <Alert type="info">
                Enter the 6-digit OTP for {emailForm.newEmail}. The code expires automatically.
              </Alert>
              <label className="block text-sm font-semibold text-brand-black">
                Verification code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={emailCode}
                  onChange={(event) =>
                    setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 tracking-[0.35em] outline-none focus:border-brand-black"
                />
              </label>
              <div className="flex gap-3">
                <button disabled={emailBusy} className="flex-1 rounded-xl bg-brand-yellow px-5 py-3 text-sm font-extrabold text-brand-black disabled:opacity-60">
                  {emailBusy ? "Verifying..." : "Confirm email change"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailChallenge(null);
                    setEmailCode("");
                    setEmailError("");
                    setEmailNotice("");
                  }}
                  className="rounded-xl border border-brand-border px-4 py-3 text-sm font-bold text-brand-black"
                >
                  Start over
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-muted">
            Password
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-brand-black">Change password</h2>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Confirm your current password, then choose a new password of at least 8 characters.
          </p>

          <div className="mt-5 space-y-3">
            <Alert>{passwordError}</Alert>
            <Alert type="success">{passwordNotice}</Alert>
          </div>

          <form onSubmit={submitPasswordChange} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-brand-black">
              Current password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((old) => ({ ...old, currentPassword: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
              />
            </label>
            <label className="block text-sm font-semibold text-brand-black">
              New password
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((old) => ({ ...old, newPassword: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
              />
            </label>
            <label className="block text-sm font-semibold text-brand-black">
              Confirm new password
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((old) => ({ ...old, confirmPassword: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
              />
            </label>
            <button disabled={passwordBusy} className="w-full rounded-xl bg-brand-black px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
              {passwordBusy ? "Changing password..." : "Change password"}
            </button>
          </form>

          <p className="mt-5 text-sm text-brand-muted">
            Forgotten your password instead?{" "}
            <Link to="/forgot-password" className="font-bold text-brand-black hover:underline">
              Use password recovery
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}
