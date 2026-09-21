import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PasswordField from "../components/ui/PasswordField.jsx";
import { useAuth } from "../context/useAuth.js";

function Alert({ type = "error", children }) {
  if (!children) return null;

  const className =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : type === "info"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${className}`}>
      {children}
    </div>
  );
}

function SecurityIcon({ type }) {
  if (type === "email") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="m5 7 7 5.2L19 7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function formatExpiry(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [emailResendSeconds, setEmailResendSeconds] = useState(0);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  useEffect(() => {
    if (emailResendSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setEmailResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [emailResendSeconds]);

  async function createEmailChallenge() {
    setEmailBusy(true);
    setEmailError("");
    setEmailNotice("");

    try {
      const result = await requestEmailChange(emailForm);
      setEmailChallenge(result);
      setEmailCode("");
      setEmailResendSeconds(Number(result.resendAfterSeconds || 60));
      setEmailNotice(result.message);
    } catch (error) {
      setEmailError(error.message);
    } finally {
      setEmailBusy(false);
    }
  }

  async function startEmailChange(event) {
    event.preventDefault();
    await createEmailChallenge();
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
      setEmailResendSeconds(0);
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

  function resetEmailFlow() {
    setEmailChallenge(null);
    setEmailCode("");
    setEmailResendSeconds(0);
    setEmailError("");
    setEmailNotice("");
  }

  return (
    <main className="min-h-screen bg-brand-background">
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#806600]">
                Account security
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-brand-black sm:text-4xl">
                Sign-in & security
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted sm:text-[15px]">
                Manage the credentials that protect your FindMyLawyer account. Sensitive changes revoke older signed-in sessions automatically.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-brand-border bg-brand-background px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-yellow-soft text-brand-black">
                <SecurityIcon type="password" />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-muted">
                  Signed in as
                </p>
                <p className="mt-0.5 max-w-64 truncate text-sm font-bold text-brand-black">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="overflow-hidden rounded-[24px] border border-brand-border bg-white shadow-[0_18px_45px_-34px_rgba(20,20,20,0.4)]">
          <div className="border-b border-brand-border p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-yellow/30 bg-brand-yellow-soft text-[#806600]">
                <SecurityIcon type="email" />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-muted">
                  Sign-in email
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-brand-black">Change email address</h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Your current sign-in email is <span className="font-semibold text-brand-black">{user?.email}</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7">
            <div className="space-y-3">
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
                    autoComplete="email"
                    value={emailForm.newEmail}
                    onChange={(event) =>
                      setEmailForm((old) => ({ ...old, newEmail: event.target.value }))
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-brand-border px-4 outline-none transition hover:border-neutral-300 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
                  />
                </label>

                <PasswordField
                  label="Current password"
                  value={emailForm.currentPassword}
                  onChange={(event) =>
                    setEmailForm((old) => ({ ...old, currentPassword: event.target.value }))
                  }
                  autoComplete="current-password"
                  disabled={emailBusy}
                />

                <button
                  disabled={emailBusy}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-yellow px-5 text-sm font-extrabold text-brand-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {emailBusy ? "Creating code..." : "Verify new email"}
                </button>

                <p className="rounded-xl bg-brand-background px-4 py-3 text-xs leading-5 text-brand-muted">
                  Local development mode prints the 6-digit verification code in the server terminal. The browser never receives the OTP directly.
                </p>
              </form>
            ) : (
              <form onSubmit={finishEmailChange} className="mt-5 space-y-4">
                <Alert type="info">
                  Enter the 6-digit code for <strong>{emailForm.newEmail}</strong>.{formatExpiry(emailChallenge.expiresAt) ? ` It expires around ${formatExpiry(emailChallenge.expiresAt)}.` : ""}
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
                    className="mt-2 h-12 w-full rounded-xl border border-brand-border px-4 text-center text-lg font-bold tracking-[0.42em] outline-none transition hover:border-neutral-300 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
                  />
                </label>

                <button
                  disabled={emailBusy || emailCode.length !== 6}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-yellow px-5 text-sm font-extrabold text-brand-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {emailBusy ? "Verifying..." : "Confirm email change"}
                </button>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void createEmailChallenge()}
                    disabled={emailBusy || emailResendSeconds > 0}
                    className="flex-1 rounded-xl border border-brand-border px-4 py-2.5 text-sm font-bold text-brand-black transition hover:bg-brand-background disabled:cursor-not-allowed disabled:text-brand-muted"
                  >
                    {emailResendSeconds > 0
                      ? `Resend code in ${emailResendSeconds}s`
                      : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={resetEmailFlow}
                    disabled={emailBusy}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-muted transition hover:bg-brand-background hover:text-brand-black disabled:opacity-50"
                  >
                    Change email
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-brand-border bg-white shadow-[0_18px_45px_-34px_rgba(20,20,20,0.4)]">
          <div className="border-b border-brand-border p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-yellow/30 bg-brand-yellow-soft text-[#806600]">
                <SecurityIcon type="password" />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-muted">
                  Password
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-brand-black">Change password</h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Choose a password of at least 8 characters that differs from your current password.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7">
            <div className="space-y-3">
              <Alert>{passwordError}</Alert>
              <Alert type="success">{passwordNotice}</Alert>
            </div>

            <form onSubmit={submitPasswordChange} className="mt-5 space-y-4">
              <PasswordField
                label="Current password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((old) => ({ ...old, currentPassword: event.target.value }))
                }
                autoComplete="current-password"
                disabled={passwordBusy}
              />
              <PasswordField
                label="New password"
                hint="8+ characters"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((old) => ({ ...old, newPassword: event.target.value }))
                }
                minLength={8}
                autoComplete="new-password"
                disabled={passwordBusy}
              />
              <PasswordField
                label="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((old) => ({ ...old, confirmPassword: event.target.value }))
                }
                minLength={8}
                autoComplete="new-password"
                disabled={passwordBusy}
              />

              {passwordForm.confirmPassword && (
                <p className={`text-xs font-semibold ${passwordForm.newPassword === passwordForm.confirmPassword ? "text-emerald-700" : "text-red-600"}`}>
                  {passwordForm.newPassword === passwordForm.confirmPassword
                    ? "Passwords match."
                    : "Passwords do not match yet."}
                </p>
              )}

              <button
                disabled={passwordBusy}
                className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-black px-5 text-sm font-extrabold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordBusy ? "Changing password..." : "Change password"}
              </button>
            </form>

            <div className="mt-5 border-t border-brand-border pt-5">
              <p className="text-sm text-brand-muted">
                Forgotten your password instead?{" "}
                <Link to="/forgot-password" className="font-bold text-brand-black underline decoration-brand-yellow underline-offset-4">
                  Use password recovery
                </Link>
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
