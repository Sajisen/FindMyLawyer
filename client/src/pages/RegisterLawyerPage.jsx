import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth.js";
import LocationAutocomplete from "../features/search/components/LocationAutocomplete.jsx";
import useLegalCategories from "../features/search/hooks/useLegalCategories.js";
import {
  consultationModes,
  languages,
} from "../features/search/data/searchOptions.js";
import SelectControl from "../components/ui/SelectControl.jsx";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  displayName: "",
  professionalTitle: "Attorney-at-Law",
  phone: "",
  officeCity: "",
  locationId: "",
  district: "",
  province: "",
  primaryPracticeArea: "",
  secondaryPracticeAreas: [],
  yearsOfPractice: "",
  description: "",
  languages: [],
  consultationModes: [],
  acceptingNewClients: true,
};

const accountFields = [
  { name: "name", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
  },
  { name: "displayName", label: "Public display name" },
  { name: "professionalTitle", label: "Professional title" },
  { name: "phone", label: "Contact phone", type: "tel", autoComplete: "tel" },
];

export default function RegisterLawyerPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { categories, loading: categoriesLoading } = useLegalCategories();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [secondaryChoice, setSecondaryChoice] = useState("");

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

  function addSecondaryArea() {
    if (!secondaryChoice || secondaryChoice === form.primaryPracticeArea || form.secondaryPracticeAreas.includes(secondaryChoice)) return;
    update("secondaryPracticeAreas", [...form.secondaryPracticeAreas, secondaryChoice]);
    setSecondaryChoice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.locationId) {
      setError("Select an office location from the available suggestions.");
      return;
    }

    setSubmitting(true);

    try {
      await register("lawyer", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        professionalTitle: form.professionalTitle.trim(),
        phone: form.phone.trim(),
        locationId: form.locationId,
        officeCity: form.officeCity,
        primaryPracticeArea: form.primaryPracticeArea,
        practiceAreas: [form.primaryPracticeArea, ...form.secondaryPracticeAreas],
        languages: form.languages,
        consultationModes: form.consultationModes,
        yearsOfPractice: Number(form.yearsOfPractice || 0),
        description: form.description.trim(),
        acceptingNewClients: form.acceptingNewClients,
      });

      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-brand-background">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
            Lawyer registration
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-brand-black">
            Create your lawyer account
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
            Your profile will be reviewed by an administrator before it appears in public search results.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <section>
              <h2 className="text-lg font-bold text-brand-black">
                Account and public details
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {accountFields.map((field) => (
                  <label
                    key={field.name}
                    className={field.name === "phone" ? "block" : "block"}
                  >
                    <span className="text-sm font-semibold text-brand-black">
                      {field.label}
                    </span>
                    <input
                      name={field.name}
                      type={field.type || "text"}
                      autoComplete={field.autoComplete}
                      value={form[field.name]}
                      onChange={(event) => update(field.name, event.target.value)}
                      minLength={field.name === "password" ? 8 : undefined}
                      required
                      className="mt-2 h-12 w-full rounded-xl border border-brand-border px-4 text-sm outline-none transition focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="border-t border-brand-border pt-8">
              <h2 className="text-lg font-bold text-brand-black">
                Practice information
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="lawyer-office-location"
                    className="text-sm font-semibold text-brand-black"
                  >
                    Office location
                  </label>
                  <div className="mt-2">
                    <LocationAutocomplete
                      id="lawyer-office-location"
                      value={form.officeCity}
                      onChange={(value) => {
                        update("officeCity", value);
                        update("locationId", "");
                        update("district", "");
                        update("province", "");
                      }}
                      onSelect={(location) => {
                        setForm((previous) => ({
                          ...previous,
                          officeCity: location?.city || previous.officeCity,
                          locationId: location?.id || "",
                          district: location?.district || "",
                          province: location?.province || "",
                        }));
                      }}
                      placeholder="Start typing a city"
                    />
                  </div>
                  {form.locationId && (
                    <p className="mt-2 text-xs text-brand-muted">
                      {[form.district, form.province].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lawyer-primary-practice"
                    className="text-sm font-semibold text-brand-black"
                  >
                    Primary practice area
                  </label>
                  <div className="mt-2">
                    <SelectControl
                      id="lawyer-primary-practice"
                      required
                      value={form.primaryPracticeArea}
                      disabled={categoriesLoading}
                      onChange={(event) =>
                        update("primaryPracticeArea", event.target.value)
                      }
                    >
                      <option value="">Select a practice area</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </SelectControl>
                  </div>
                </div>

                <div>
                  <label htmlFor="lawyer-secondary-practice" className="text-sm font-semibold text-brand-black">Other practice areas (optional)</label>
                  <div className="mt-2 flex gap-2"><select id="lawyer-secondary-practice" value={secondaryChoice} onChange={(event) => setSecondaryChoice(event.target.value)} className="w-full rounded-xl border border-brand-border p-3"><option value="">Select an area</option>{categories.filter((item) => item.id !== form.primaryPracticeArea && !form.secondaryPracticeAreas.includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={addSecondaryArea} className="rounded-xl border px-4">Add</button></div>
                  <div className="mt-2 flex flex-wrap gap-2">{form.secondaryPracticeAreas.map((id) => <button type="button" key={id} onClick={() => update("secondaryPracticeAreas", form.secondaryPracticeAreas.filter((value) => value !== id))} className="rounded-full bg-brand-background px-3 py-1 text-sm">{categories.find((item) => item.id === id)?.name || id} ×</button>)}</div>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-brand-black">
                    Years of practice
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.yearsOfPractice}
                    onChange={(event) =>
                      update("yearsOfPractice", event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-brand-border px-4 text-sm outline-none transition focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
                  />
                </label>
              </div>
            </section>

            <fieldset className="border-t border-brand-border pt-8">
              <legend className="text-lg font-bold text-brand-black">
                Languages
              </legend>
              <div className="mt-4 flex flex-wrap gap-3">
                {languages.map((language) => (
                  <label
                    key={language}
                    className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.languages.includes(language)}
                      onChange={() => toggle("languages", language)}
                    />
                    {language}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-lg font-bold text-brand-black">
                Consultation options
              </legend>
              <div className="mt-4 flex flex-wrap gap-3">
                {consultationModes.map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.consultationModes.includes(mode)}
                      onChange={() => toggle("consultationModes", mode)}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="text-sm font-semibold text-brand-black">
                About your practice
              </span>
              <textarea
                rows="4"
                maxLength="2000"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none transition focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-brand-black">
              <input
                type="checkbox"
                checked={form.acceptingNewClients}
                onChange={(event) =>
                  update("acceptingNewClients", event.target.checked)
                }
              />
              Accepting new clients
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-12 w-full rounded-xl bg-brand-black px-5 font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Submit registration"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-muted">
            Already registered?{" "}
            <Link to="/login" className="font-bold text-brand-black hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-brand-muted">
            Looking for legal help?{" "}
            <Link to="/register" className="font-bold text-brand-black hover:underline">
              Register as a client
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
