import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/useAuth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const user = await login(
        form.email,
        form.password
      );

      if (location.state?.from) {
        navigate(location.state.from, { replace: true });
        return;
      }

      if (user.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      // Client and lawyer sign-ins land on Home by default. Their profile is
      // available from the account menu in the navigation bar.
      navigate("/", { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-brand-background">
      <div className="mx-auto max-w-md px-5 py-16 sm:px-6">
        <div className="rounded-2xl border border-brand-border bg-white p-7 shadow-sm">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
            Account
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-brand-black">
            Sign in
          </h1>

          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Sign in to your FindMyLawyer account.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-black">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-brand-black">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-brand-muted hover:text-brand-black hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-black px-5 font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-muted">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-brand-black hover:underline"
            >
              Register
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-brand-muted">
            Are you a lawyer?{" "}
            <Link
              to="/register-lawyer"
              className="font-bold text-brand-black hover:underline"
            >
              Register as a lawyer
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}