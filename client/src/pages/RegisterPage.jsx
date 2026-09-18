import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const fields = [
    { name: "name", label: "Full name", type: "text", autoComplete: "name" },
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
  ];

  return (
    <main className="min-h-[70vh] bg-brand-background">
      <div className="mx-auto max-w-lg px-5 py-16 sm:px-6">
        <div className="rounded-2xl border border-brand-border bg-white p-7 shadow-sm">
          <h1 className="text-3xl font-extrabold text-brand-black">Create a client account</h1>
          <p className="mt-2 text-sm text-brand-muted">Register to use FindMyLawyer.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {fields.map((field) => (
              <label key={field.name} className="block text-sm font-semibold text-brand-black">
                {field.label}
                <input
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  value={form[field.name]}
                  onChange={(event) => setForm((previous) => ({ ...previous, [field.name]: event.target.value }))}
                  minLength={field.name === "password" ? 8 : undefined}
                  required
                  className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
                />
              </label>
            ))}
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={submitting} className="min-h-12 w-full rounded-xl bg-brand-black px-5 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-brand-muted">Already registered? <Link to="/login" className="font-bold text-brand-black hover:underline">Sign in</Link></p>
          <p className="mt-3 text-center text-sm text-brand-muted">Are you a lawyer? <Link to="/register-lawyer" className="font-bold text-brand-black hover:underline">Register as a lawyer</Link></p>
        </div>
      </div>
    </main>
  );
}
