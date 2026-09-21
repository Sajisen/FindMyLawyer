import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PasswordField from "../components/ui/PasswordField.jsx";
import { apiRequest } from "../services/api.js";

function formatExpiry(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function RecoveryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M12 3.5 18.5 6v5.2c0 4-2.4 7-6.5 9.3-4.1-2.3-6.5-5.3-6.5-9.3V6L12 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12.2h6M12 9.2v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [complete, setComplete] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  async function createResetChallenge() {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest("/auth/password/reset/request", {
        method: "POST",
        body: { email },
      });
      setChallenge(result);
      setCode("");
      setResendSeconds(Number(result.resendAfterSeconds || 60));
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function requestReset(event) {
    event.preventDefault();
    await createResetChallenge();
  }

  async function confirmReset(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setBusy(true);

    try {
      const result = await apiRequest("/auth/password/reset/confirm", {
        method: "POST",
        body: {
          challengeId: challenge.challengeId,
          code,
          newPassword: password,
        },
      });
      setComplete(true);
      setNotice(result.message);
      setResendSeconds(0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setChallenge(null);
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setNotice("");
    setResendSeconds(0);
  }

  return (
    <main className="bg-brand-background">
      <div className="mx-auto flex min-h-[72vh] max-w-5xl items-center px-5 py-12 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-[0_24px_70px_-42px_rgba(20,20,20,0.36)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="relative hidden overflow-hidden bg-brand-black p-8 text-white lg:block">
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full border-[36px] border-brand-yellow/10" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow text-brand-black">
                  <RecoveryIcon />
                </span>
                <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-yellow">
                  Secure recovery
                </p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em]">
                  Reset access without exposing your account.
                </h1>
                <p className="mt-4 text-sm leading-7 text-neutral-400">
                  Reset requests use short-lived verification challenges and revoke older sessions after a successful password change.
                </p>
              </div>
              <p className="text-xs leading-5 text-neutral-500">
                The public request response does not reveal whether an email address belongs to an account.
              </p>
            </div>
          </div>

          <div className="p-7 sm:p-9 lg:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#806600]">
              Account recovery
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-brand-black">
              {complete ? "Password reset complete" : "Reset password"}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">
              {complete
                ? "Your password has been updated and older signed-in sessions have been revoked."
                : "Request a short-lived verification code, then choose a new password."}
            </p>

            {error && (
              <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </p>
            )}
            {notice && (
              <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                {notice}
              </p>
            )}

            {complete ? (
              <div className="mt-7">
                <Link
                  to="/login"
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-black px-5 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  Return to sign in
                </Link>
              </div>
            ) : !challenge ? (
              <form onSubmit={requestReset} className="mt-7 space-y-4">
                <label className="block text-sm font-semibold text-brand-black">
                  Account email
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-brand-border px-4 outline-none transition hover:border-neutral-300 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
                  />
                </label>
                <button
                  disabled={busy}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-yellow px-5 text-sm font-extrabold text-brand-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Creating code..." : "Request reset code"}
                </button>
                <p className="rounded-xl bg-brand-background px-4 py-3 text-xs leading-5 text-brand-muted">
                  In local development, the OTP appears in the server terminal. The API response never contains the code.
                </p>
              </form>
            ) : (
              <form onSubmit={confirmReset} className="mt-7 space-y-4">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
                  Enter the 6-digit code for <strong>{email}</strong>.{formatExpiry(challenge.expiresAt) ? ` It expires around ${formatExpiry(challenge.expiresAt)}.` : ""}
                </div>

                <label className="block text-sm font-semibold text-brand-black">
                  Verification code
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-brand-border px-4 text-center text-lg font-bold tracking-[0.42em] outline-none transition hover:border-neutral-300 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
                  />
                </label>

                <PasswordField
                  label="New password"
                  hint="8+ characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  disabled={busy}
                />
                <PasswordField
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  disabled={busy}
                />

                {confirmPassword && (
                  <p className={`text-xs font-semibold ${password === confirmPassword ? "text-emerald-700" : "text-red-600"}`}>
                    {password === confirmPassword ? "Passwords match." : "Passwords do not match yet."}
                  </p>
                )}

                <button
                  disabled={busy || code.length !== 6}
                  className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-black px-5 text-sm font-extrabold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Resetting..." : "Reset password"}
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void createResetChallenge()}
                    disabled={busy || resendSeconds > 0}
                    className="rounded-xl border border-brand-border px-4 py-2.5 text-sm font-bold text-brand-black transition hover:bg-brand-background disabled:cursor-not-allowed disabled:text-brand-muted"
                  >
                    {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={startOver}
                    disabled={busy}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-muted transition hover:bg-brand-background hover:text-brand-black disabled:opacity-50"
                  >
                    Use another email
                  </button>
                </div>
              </form>
            )}

            <p className="mt-7 text-sm text-brand-muted">
              Remembered your password?{" "}
              <Link to="/login" className="font-bold text-brand-black underline decoration-brand-yellow underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
