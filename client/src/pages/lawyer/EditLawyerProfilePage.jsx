import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { apiRequest } from "../../services/api.js";

const initialForm = {
  displayName: "",
  professionalTitle: "",
  phone: "",
  province: "",
  district: "",
  officeCity: "",
  primaryPracticeArea: "",
  practiceAreas: "",
  subAreas: "",
  languages: "",
  consultationModes: "",
  yearsOfPractice: "",
  description: "",
  acceptingNewClients: true,
};

export default function EditLawyerProfilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest(
          "/lawyers/me/profile",
          {
            token,
          }
        );

        const profile = data.profile ?? data;

        setForm({
          displayName: profile.displayName || "",
          professionalTitle:
            profile.professionalTitle || "",
          phone: profile.phone || "",
          province: profile.province || "",
          district: profile.district || "",
          officeCity: profile.officeCity || "",
          primaryPracticeArea:
            profile.primaryPracticeArea || "",
          practiceAreas:
            profile.practiceAreas?.join(", ") || "",
          subAreas:
            profile.subAreas?.join(", ") || "",
          languages:
            profile.languages?.join(", ") || "",
          consultationModes:
            profile.consultationModes?.join(", ") ||
            "",
          yearsOfPractice:
            profile.yearsOfPractice ?? "",
          description: profile.description || "",
          acceptingNewClients:
            profile.acceptingNewClients ?? true,
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadProfile();
    }
  }, [token]);

  function handleChange(event) {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function convertToArray(value) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiRequest(
        "/lawyers/me/profile",
        {
          method: "PATCH",
          token,
          body: {
            displayName: form.displayName,
            professionalTitle:
              form.professionalTitle,
            phone: form.phone,
            province: form.province,
            district: form.district,
            officeCity: form.officeCity,
            primaryPracticeArea:
              form.primaryPracticeArea,

            practiceAreas: convertToArray(
              form.practiceAreas
            ),

            subAreas: convertToArray(
              form.subAreas
            ),

            languages: convertToArray(
              form.languages
            ),

            consultationModes: convertToArray(
              form.consultationModes
            ),

            yearsOfPractice:
              form.yearsOfPractice === ""
                ? 0
                : Number(
                    form.yearsOfPractice
                  ),

            description: form.description,

            acceptingNewClients:
              form.acceptingNewClients,
          },
        }
      );

      navigate("/lawyer");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-brand-background">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6">
          <p className="text-brand-muted">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-background">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
              Lawyer Account
            </p>

            <h1 className="mt-3 text-4xl font-extrabold text-brand-black">
              Edit Profile
            </h1>

            <p className="mt-2 text-brand-muted">
              Update the information shown on
              your lawyer profile.
            </p>
          </div>

          <Link
            to="/lawyer"
            className="rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-black"
          >
            Back
          </Link>
        </div>

        {error && (
          <div className="mt-7 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-7 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Input
              label="Display Name"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              required
            />

            <Input
              label="Professional Title"
              name="professionalTitle"
              value={form.professionalTitle}
              onChange={handleChange}
            />

            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />

            <Input
              label="Province"
              name="province"
              value={form.province}
              onChange={handleChange}
            />

            <Input
              label="District"
              name="district"
              value={form.district}
              onChange={handleChange}
            />

            <Input
              label="Office City"
              name="officeCity"
              value={form.officeCity}
              onChange={handleChange}
            />

            <Input
              label="Primary Practice Area"
              name="primaryPracticeArea"
              value={form.primaryPracticeArea}
              onChange={handleChange}
            />

            <Input
              label="Years of Practice"
              name="yearsOfPractice"
              type="number"
              min="0"
              value={form.yearsOfPractice}
              onChange={handleChange}
            />
          </div>

          <ArrayInput
            label="Practice Areas"
            helper="Separate multiple values with commas."
            name="practiceAreas"
            value={form.practiceAreas}
            onChange={handleChange}
          />

          <ArrayInput
            label="Sub Areas"
            helper="Example: Divorce and separation, Child custody"
            name="subAreas"
            value={form.subAreas}
            onChange={handleChange}
          />

          <ArrayInput
            label="Languages"
            helper="Example: Sinhala, English, Tamil"
            name="languages"
            value={form.languages}
            onChange={handleChange}
          />

          <ArrayInput
            label="Consultation Modes"
            helper="Example: In Person, Online, Telephone"
            name="consultationModes"
            value={form.consultationModes}
            onChange={handleChange}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-brand-black">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="6"
              className="w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="acceptingNewClients"
              checked={
                form.acceptingNewClients
              }
              onChange={handleChange}
              className="h-4 w-4"
            />

            <span className="text-sm font-semibold text-brand-black">
              I am currently accepting new
              clients
            </span>
          </label>

          <div className="border-t border-brand-border pt-6">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand-black px-6 py-3 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  ...props
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-brand-black">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
        {...props}
      />
    </div>
  );
}

function ArrayInput({
  label,
  helper,
  name,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-brand-black">
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-brand-border px-4 py-3 outline-none focus:border-brand-black"
      />

      <p className="mt-2 text-sm text-brand-muted">
        {helper}
      </p>
    </div>
  );
}