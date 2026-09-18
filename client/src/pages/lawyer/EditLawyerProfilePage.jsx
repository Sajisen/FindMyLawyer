import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth.js";
import { apiRequest } from "../../services/api.js";
import LocationAutocomplete from "../../features/search/components/LocationAutocomplete.jsx";
import useLegalCategories from "../../features/search/hooks/useLegalCategories.js";
import {
  consultationModes,
  languages,
} from "../../features/search/data/searchOptions.js";
import SelectControl from "../../components/ui/SelectControl.jsx";

const initialForm = {
  displayName: "",
  professionalTitle: "",
  email: "",
  phone: "",
  officeCity: "",
  locationId: "",
  district: "",
  province: "",
  primaryPracticeArea: "",
  practiceAreas: [],
  subAreas: "",
  languages: [],
  consultationModes: [],
  yearsOfPractice: "",
  description: "",
  acceptingNewClients: true,
};

export default function EditLawyerProfilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useLegalCategories();

  const [form, setForm] = useState(initialForm);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await apiRequest("/lawyers/me/profile", { token });
        const activeProfile = data.profile ?? data;
        const pending = activeProfile.pendingProfileChanges || {};
        const editable = {
          ...activeProfile,
          ...pending,
          locationId: pending.locationId || activeProfile.locationId || "",
        };

        if (cancelled) {
          return;
        }

        setProfile(activeProfile);
        setForm({
          displayName: editable.displayName || "",
          professionalTitle: editable.professionalTitle || "",
          email: activeProfile.email || "",
          phone: activeProfile.phone || "",
          officeCity: editable.officeCity || "",
          locationId: editable.locationId || "",
          district: editable.district || "",
          province: editable.province || "",
          primaryPracticeArea: editable.primaryPracticeArea || "",
          practiceAreas: Array.isArray(editable.practiceAreas)
            ? editable.practiceAreas
            : [],
          subAreas: editable.subAreas?.join(", ") || "",
          languages: Array.isArray(activeProfile.languages)
            ? activeProfile.languages
            : [],
          consultationModes: Array.isArray(activeProfile.consultationModes)
            ? activeProfile.consultationModes
            : [],
          yearsOfPractice: editable.yearsOfPractice ?? "",
          description: editable.description || "",
          acceptingNewClients: activeProfile.acceptingNewClients ?? true,
        });
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (token) {
      void loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  function update(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function toggleArray(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: previous[name].includes(value)
        ? previous[name].filter((item) => item !== value)
        : [...previous[name], value],
    }));
  }

  function setPrimaryPracticeArea(value) {
    setForm((previous) => ({
      ...previous,
      primaryPracticeArea: value,
      practiceAreas: value
        ? [...new Set([value, ...previous.practiceAreas])]
        : previous.practiceAreas,
    }));
  }

  function convertToArray(value) {
    return [
      ...new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (!form.locationId) {
      setError("Select an office location from the available suggestions.");
      setSaving(false);
      return;
    }

    if (!form.primaryPracticeArea) {
      setError("Select a primary practice area.");
      setSaving(false);
      return;
    }

    try {
      const data = await apiRequest("/lawyers/me/profile", {
        method: "PATCH",
        token,
        body: {
          displayName: form.displayName.trim(),
          professionalTitle: form.professionalTitle.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          locationId: form.locationId,
          officeCity: form.officeCity,
          primaryPracticeArea: form.primaryPracticeArea,
          practiceAreas: [
            ...new Set([form.primaryPracticeArea, ...form.practiceAreas]),
          ],
          subAreas: convertToArray(form.subAreas),
          languages: form.languages,
          consultationModes: form.consultationModes,
          yearsOfPractice:
            form.yearsOfPractice === "" ? 0 : Number(form.yearsOfPractice),
          description: form.description.trim(),
          acceptingNewClients: form.acceptingNewClients,
        },
      });

      navigate("/profile", {
        replace: true,
        state: {
          profileNotice: data.message || "Profile updated.",
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-brand-background">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6">
          <p className="text-brand-muted">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-background">
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
                Lawyer account
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
                Edit profile
              </h1>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Keep your public information accurate and up to date.
              </p>
            </div>

            <Link
              to="/profile"
              className="self-start rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-black transition hover:bg-brand-background"
            >
              Back to profile
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-8">
        {profile?.isPublished && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="font-bold text-amber-950">How profile updates work</p>
            <p className="mt-1 text-sm leading-6 text-amber-900/80">
              Contact preferences update immediately. Professional details such as practice areas, location, experience and public profile text are reviewed before replacing your currently approved profile.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-8"
        >
          <section>
            <SectionHeading
              title="Public details"
              review={profile?.isPublished}
            />
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <Input
                label="Display name"
                name="displayName"
                value={form.displayName}
                onChange={(event) => update("displayName", event.target.value)}
                required
              />
              <Input
                label="Professional title"
                name="professionalTitle"
                value={form.professionalTitle}
                onChange={(event) =>
                  update("professionalTitle", event.target.value)
                }
                required
              />
              <Input
                label="Public contact email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                required
                hint={profile?.isPublished ? "Updates immediately. Your sign-in email does not change." : undefined}
              />
              <Input
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                hint={profile?.isPublished ? "Updates immediately" : undefined}
              />
              <Input
                label="Years of practice"
                name="yearsOfPractice"
                type="number"
                min="0"
                step="1"
                value={form.yearsOfPractice}
                onChange={(event) =>
                  update("yearsOfPractice", event.target.value)
                }
              />
            </div>
          </section>

          <section className="border-t border-brand-border pt-8">
            <SectionHeading
              title="Location and practice"
              review={profile?.isPublished}
            />
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-lawyer-location"
                  className="text-sm font-semibold text-brand-black"
                >
                  Office location
                </label>
                <div className="mt-2">
                  <LocationAutocomplete
                    id="edit-lawyer-location"
                    value={form.officeCity}
                    onChange={(value) => {
                      update("officeCity", value);
                      update("locationId", "");
                      update("district", "");
                      update("province", "");
                    }}
                    onSelect={(selectedLocation) => {
                      setForm((previous) => ({
                        ...previous,
                        officeCity:
                          selectedLocation?.city || previous.officeCity,
                        locationId: selectedLocation?.id || "",
                        district: selectedLocation?.district || "",
                        province: selectedLocation?.province || "",
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
                  htmlFor="edit-primary-practice"
                  className="text-sm font-semibold text-brand-black"
                >
                  Primary practice area
                </label>
                <div className="mt-2">
                  <SelectControl
                    id="edit-primary-practice"
                    value={form.primaryPracticeArea}
                    disabled={categoriesLoading}
                    onChange={(event) =>
                      setPrimaryPracticeArea(event.target.value)
                    }
                    required
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
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-brand-black">
                Additional practice areas
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {categories
                  .filter(
                    (category) => category.id !== form.primaryPracticeArea
                  )
                  .map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2.5 text-sm transition hover:bg-brand-background"
                    >
                      <input
                        type="checkbox"
                        checked={form.practiceAreas.includes(category.id)}
                        onChange={() =>
                          toggleArray("practiceAreas", category.id)
                        }
                      />
                      {category.name}
                    </label>
                  ))}
              </div>
            </fieldset>
          </section>

          <section className="border-t border-brand-border pt-8">
            <SectionHeading title="Contact preferences" />

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-brand-black">
                Languages
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {languages.map((language) => (
                  <label
                    key={language}
                    className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2.5 text-sm transition hover:bg-brand-background"
                  >
                    <input
                      type="checkbox"
                      checked={form.languages.includes(language)}
                      onChange={() => toggleArray("languages", language)}
                    />
                    {language}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-brand-black">
                Consultation modes
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {consultationModes.map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2.5 text-sm transition hover:bg-brand-background"
                  >
                    <input
                      type="checkbox"
                      checked={form.consultationModes.includes(mode)}
                      onChange={() => toggleArray("consultationModes", mode)}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="border-t border-brand-border pt-8">
            <SectionHeading
              title="Professional description"
              review={profile?.isPublished}
            />

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-brand-black">
                Areas of focus
              </span>
              <input
                type="text"
                value={form.subAreas}
                onChange={(event) => update("subAreas", event.target.value)}
                className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none transition focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
              />
              <p className="mt-2 text-sm text-brand-muted">
                Separate multiple areas with commas.
              </p>
            </label>

            <label className="mt-6 block">
              <span className="text-sm font-semibold text-brand-black">
                About
              </span>
              <textarea
                rows="5"
                maxLength="2000"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                className="mt-2 w-full rounded-xl border border-brand-border px-4 py-3 outline-none transition focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
              />
            </label>
          </section>

          <label className="flex items-center gap-3 rounded-xl bg-brand-background px-4 py-3 text-sm font-semibold text-brand-black">
            <input
              type="checkbox"
              checked={form.acceptingNewClients}
              onChange={(event) =>
                update("acceptingNewClients", event.target.checked)
              }
            />
            Accepting new clients
          </label>

          <div className="flex flex-wrap justify-end gap-3 border-t border-brand-border pt-6">
            <Link
              to="/profile"
              className="rounded-xl border border-brand-border px-6 py-3 font-semibold text-brand-black transition hover:bg-brand-background"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand-yellow px-6 py-3 font-bold text-brand-black transition hover:bg-brand-yellow-dark disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function SectionHeading({ title, review = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-lg font-bold text-brand-black">{title}</h2>
      {review && (
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
          Review required
        </span>
      )}
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", hint, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-brand-black">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 h-12 w-full rounded-xl border border-brand-border px-4 outline-none transition focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
        {...props}
      />
      {hint && <span className="mt-1.5 block text-xs text-brand-muted">{hint}</span>}
    </label>
  );
}
