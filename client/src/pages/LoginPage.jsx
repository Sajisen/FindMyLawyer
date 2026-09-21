import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import PasswordField from "../components/ui/PasswordField.jsx";
import { useAuth } from "../context/useAuth.js";

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 19c.8-3.2 3.2-5 6.5-5s5.7 1.8 6.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(form.email.trim(), form.password);
      const requestedDestination = location.state?.from;
      const defaultDestination = user.role === "admin" ? "/admin" : "/";
      const isSafeInternalDestination =
        typeof requestedDestination === "string" &&
        requestedDestination.startsWith("/") &&
        !requestedDestination.startsWith("//");
      const destination = isSafeInternalDestination
        ? requestedDestination
        : defaultDestination;

      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-brand-background">
      <div className="mx-auto flex min-h-[72vh] max-w-5xl items-center px-5 py-12 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-[0_24px_70px_-42px_rgba(20,20,20,0.36)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="relative hidden overflow-hidden bg-brand-black p-8 text-white lg:block">
            <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full border-[42px] border-brand-yellow/10" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow text-brand-black">
                  <AccountIcon />
                </span>
                <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-yellow">
                  Welcome back
                </p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em]">
                  Continue your lawyer discovery with your account.
                </h1>
                <p className="mt-4 text-sm leading-7 text-neutral-400">
                  Access saved lawyers, your profile, verification tools, or administration features based on your account role.
                </p>
              </div>
              <p className="text-xs leading-5 text-neutral-500">
                Your sign-in credentials are handled separately from public lawyer contact details.
              </p>
            </div>
          </div>

          <div className="p-7 sm:p-9 lg:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#806600]">
              Account
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-brand-black">
              Sign in
            </h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Sign in to your FindMyLawyer account.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block text-sm font-semibold text-brand-black">
                Email
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  className="mt-2 h-11 w-full rounded-xl border border-brand-border px-4 outline-none transition hover:border-neutral-300 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20 disabled:bg-neutral-50"
                />
              </label>

              <div>
                <div className="mb-2 flex items-center justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-brand-muted transition hover:text-brand-black"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordField
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={submitting}
                />
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-black px-5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-7 grid gap-3 border-t border-brand-border pt-6 sm:grid-cols-2">
              <Link
                to="/register"
                className="rounded-xl border border-brand-border bg-white px-4 py-3 text-center text-sm font-bold text-brand-black transition hover:bg-brand-background"
              >
                Create client account
              </Link>
              <Link
                to="/register-lawyer"
                className="rounded-xl border border-brand-border bg-white px-4 py-3 text-center text-sm font-bold text-brand-black transition hover:bg-brand-background"
              >
                Join as a lawyer
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
