import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import useLegalCategories from "../features/search/hooks/useLegalCategories.js";
import { languages, consultationModes } from "../features/search/data/searchOptions.js";

const initialForm = {
  name: "", email: "", password: "", confirmPassword: "", displayName: "",
  professionalTitle: "", phone: "", province: "", district: "", officeCity: "",
  primaryPracticeArea: "", yearsOfPractice: "", description: "",
  languages: [], consultationModes: [], acceptingNewClients: true,
};

const details = [
  { name: "name", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
  { name: "displayName", label: "Public display name" },
  { name: "professionalTitle", label: "Professional title" },
  { name: "phone", label: "Contact phone", type: "tel", autoComplete: "tel" },
  { name: "province", label: "Province" },
  { name: "district", label: "District" },
  { name: "officeCity", label: "Office city" },
];

export default function RegisterLawyerPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { categories } = useLegalCategories();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function toggle(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: previous[name].includes(value)
        ? previous[name].filter((item) => item !== value)
        : [...previous[name], value],
    }));
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
      const { confirmPassword, ...detailsToSubmit } = form;
      void confirmPassword;
      await register("lawyer", {
        ...detailsToSubmit,
        name: form.name.trim(),
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        professionalTitle: form.professionalTitle.trim(),
        phone: form.phone.trim(),
        province: form.province.trim(),
        district: form.district.trim(),
        officeCity: form.officeCity.trim(),
        practiceAreas: [form.primaryPracticeArea],
        yearsOfPractice: Number(form.yearsOfPractice || 0),
      });
      navigate("/lawyer", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-brand-background">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <div className="rounded-2xl border border-brand-border bg-white p-7 shadow-sm">
          <h1 className="text-3xl font-extrabold text-brand-black">Register as a lawyer</h1>
          <p className="mt-2 text-sm leading-6 text-brand-muted">Your profile will be reviewed by an admin before it appears in public search results.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {details.map((field) => (
                <label key={field.name} className="block text-sm font-semibold text-brand-black">
                  {field.label}
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    autoComplete={field.autoComplete}
                    value={form[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    minLength={field.name === "password" ? 8 : undefined}
                    required
                    className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
                  />
                </label>
              ))}
              <label className="block text-sm font-semibold text-brand-black">
                Primary practice area
                <select required value={form.primaryPracticeArea} onChange={(event) => update("primaryPracticeArea", event.target.value)} className="mt-2 w-full rounded-xl border border-brand-border bg-white px-4 py-3">
                  <option value="">Select a practice area</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-brand-black">
                Years of practice
                <input type="number" min="0" step="1" value={form.yearsOfPractice} onChange={(event) => update("yearsOfPractice", event.target.value)} className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3" />
              </label>
            </div>
            <fieldset>
              <legend className="text-sm font-semibold text-brand-black">Languages</legend>
              <div className="mt-2 flex flex-wrap gap-4">{languages.map((language) => (
                <label key={language} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.languages.includes(language)} onChange={() => toggle("languages", language)} />{language}</label>
              ))}</div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold text-brand-black">Consultation options</legend>
              <div className="mt-2 flex flex-wrap gap-4">{consultationModes.map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.consultationModes.includes(mode)} onChange={() => toggle("consultationModes", mode)} />{mode}</label>
              ))}</div>
            </fieldset>
            <label className="block text-sm font-semibold text-brand-black">About your practice
              <textarea rows="4" value={form.description} onChange={(event) => update("description", event.target.value)} className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3" />
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-black"><input type="checkbox" checked={form.acceptingNewClients} onChange={(event) => update("acceptingNewClients", event.target.checked)} />Accepting new clients</label>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={submitting} className="min-h-12 w-full rounded-xl bg-brand-black px-5 font-bold text-white hover:bg-brand-dark disabled:opacity-60">{submitting ? "Creating account..." : "Submit registration"}</button>
          </form>
          <p className="mt-6 text-center text-sm text-brand-muted">Already registered? <Link to="/login" className="font-bold text-brand-black hover:underline">Sign in</Link></p>
          <p className="mt-3 text-center text-sm text-brand-muted">Looking for legal help? <Link to="/register" className="font-bold text-brand-black hover:underline">Register as a client</Link></p>
        </div>
      </div>
    </main>
  );
}
