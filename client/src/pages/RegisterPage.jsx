import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PasswordField from "../components/ui/PasswordField.jsx";
import { useAuth } from "../context/useAuth.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register("client", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-brand-background">
      <div className="mx-auto flex min-h-[72vh] max-w-5xl items-center px-5 py-12 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-[0_24px_70px_-42px_rgba(20,20,20,0.36)] lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="p-7 sm:p-9 lg:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#806600]">
              Client account
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-brand-black">
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Save useful lawyer profiles and keep your shortlist available across sign-ins.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-brand-black sm:col-span-2">
                Full name
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={updateField}
                  maxLength={120}
                  required
                  disabled={submitting}
                  className="mt-2 h-11 w-full rounded-xl border border-brand-border px-4 outline-none transition hover:border-neutral-300 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20 disabled:bg-neutral-50"
                />
              </label>

              <label className="block text-sm font-semibold text-brand-black sm:col-span-2">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={updateField}
                  required
                  disabled={submitting}
                  className="mt-2 h-11 w-full rounded-xl border border-brand-border px-4 outline-none transition hover:border-neutral-300 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20 disabled:bg-neutral-50"
                />
              </label>

              <PasswordField
                label="Password"
                hint="8+ characters"
                name="password"
                value={form.password}
                onChange={updateField}
                minLength={8}
                autoComplete="new-password"
                disabled={submitting}
              />
              <PasswordField
                label="Confirm password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={updateField}
                minLength={8}
                autoComplete="new-password"
                disabled={submitting}
              />

              {form.confirmPassword && (
                <p className={`text-xs font-semibold sm:col-span-2 ${form.password === form.confirmPassword ? "text-emerald-700" : "text-red-600"}`}>
                  {form.password === form.confirmPassword ? "Passwords match." : "Passwords do not match yet."}
                </p>
              )}

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 sm:col-span-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="min-h-11 w-full rounded-xl bg-brand-black px-5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
              >
                {submitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-sm text-brand-muted">
              Already registered?{" "}
              <Link to="/login" className="font-bold text-brand-black underline decoration-brand-yellow underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

          <aside className="relative hidden overflow-hidden bg-brand-yellow p-8 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border-[44px] border-white/25" />
            <div className="relative">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-black/55">
                Why register?
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-brand-black">
                Keep the lawyers you want to revisit.
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-6 text-black/70">
                <p>✓ Save lawyer profiles to your account.</p>
                <p>✓ Merge guest saves only when you approve it.</p>
                <p>✓ Manage your account and security settings.</p>
              </div>
            </div>
            <Link
              to="/register-lawyer"
              className="relative mt-10 rounded-xl bg-brand-black px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Register as a lawyer instead
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
