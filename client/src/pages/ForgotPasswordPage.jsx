import { useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../services/api.js";

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

  async function requestReset(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest("/auth/password/reset/request", {
        method: "POST",
        body: { email },
      });
      setChallenge(result);
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
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
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[75vh] bg-brand-background">
      <div className="mx-auto max-w-md px-5 py-14 sm:px-6">
        <section className="rounded-3xl border border-brand-border bg-white p-7 shadow-sm">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
            Account recovery
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-brand-black">Reset password</h1>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Request a short-lived verification code, then choose a new password.
          </p>

          {error && (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {notice}
            </p>
          )}

          {complete ? (
            <div className="mt-6">
              <Link
                to="/login"
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-black px-5 font-bold text-white"
              >
                Return to sign in
              </Link>
            </div>
          ) : !challenge ? (
            <form onSubmit={requestReset} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-brand-black">
                Account email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
                />
              </label>
              <button disabled={busy} className="w-full rounded-xl bg-brand-yellow px-5 py-3 text-sm font-extrabold text-brand-black disabled:opacity-60">
                {busy ? "Creating code..." : "Request reset code"}
              </button>
              <p className="text-xs leading-5 text-brand-muted">
                During local development the OTP appears in the server terminal. The API response never contains the code.
              </p>
            </form>
          ) : (
            <form onSubmit={confirmReset} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-brand-black">
                6-digit verification code
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
                  className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 tracking-[0.35em] outline-none focus:border-brand-black"
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
                />
              </label>
              <button disabled={busy} className="w-full rounded-xl bg-brand-black px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
                {busy ? "Resetting..." : "Reset password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setChallenge(null);
                  setCode("");
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                  setNotice("");
                }}
                className="w-full rounded-xl border border-brand-border px-5 py-3 text-sm font-bold text-brand-black"
              >
                Start over / request another code
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-brand-muted">
            <Link to="/login" className="font-bold text-brand-black hover:underline">
              Back to sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
