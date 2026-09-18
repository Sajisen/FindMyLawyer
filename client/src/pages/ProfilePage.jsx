import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../context/useAuth.js";
import { useSavedLawyers } from "../context/useSavedLawyers.js";
import LawyerDashboardPage from "./lawyer/LawyerDashboardPage.jsx";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/profile" }} />;
  }

  if (user.role === "lawyer") {
    return <LawyerDashboardPage />;
  }

  return <AccountProfile user={user} />;
}

function AccountProfile({ user }) {
  const { updateAccount } = useAuth();
  const { savedCount } = useSavedLawyers();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSave(event) {
    event.preventDefault();
    const nextName = name.trim();

    if (!nextName) {
      setError("Enter your name.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateAccount({ name: nextName });
      setEditing(false);
      setNotice("Profile updated.");
    } catch (requestError) {
      setError(requestError.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-background">
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
            Your profile
          </h1>
          <p className="mt-2 text-sm leading-6 text-brand-muted sm:text-base">
            Review your account information and manage your FindMyLawyer activity.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
        {error && (
          <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {notice}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-brand-yellow-soft text-3xl font-extrabold text-brand-black">
                {getInitials(user.name)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-brand-black">
                    {user.name}
                  </h2>
                  <span className="rounded-full bg-brand-background px-3 py-1 text-xs font-bold capitalize text-brand-muted">
                    {user.role}
                  </span>
                </div>
                <p className="mt-2 break-all text-sm text-brand-muted">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-brand-border pt-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-brand-black">Account details</h3>
                  <p className="mt-1 text-sm text-brand-muted">
                    Your email is used to sign in and is not editable here.
                  </p>
                </div>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setName(user.name || "");
                      setEditing(true);
                      setError("");
                      setNotice("");
                    }}
                    className="rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-bold text-brand-black transition hover:bg-brand-background"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSave} className="mt-5 max-w-lg">
                  <label className="block text-sm font-semibold text-brand-black">
                    Name
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={120}
                      required
                      className="mt-2 h-12 w-full rounded-xl border border-brand-border px-4 outline-none transition focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
                    />
                  </label>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-brand-yellow px-5 py-2.5 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName("");
                        setEditing(false);
                        setError("");
                      }}
                      className="rounded-xl border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-black"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <ProfileItem label="Name" value={user.name} />
                  <ProfileItem label="Email" value={user.email} />
                  <ProfileItem label="Account type" value={user.role === "admin" ? "Administrator" : "Client"} />
                  <ProfileItem label="Member since" value={formatDate(user.createdAt)} />
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            {user.role === "client" && (
              <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#806600]">
                  Saved lawyers
                </p>
                <p className="mt-2 text-3xl font-extrabold text-brand-black">
                  {savedCount}
                </p>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Profiles saved to your account for later comparison.
                </p>
                <Link
                  to="/saved-lawyers"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-black hover:text-[#806600]"
                >
                  View saved lawyers <span aria-hidden="true">→</span>
                </Link>
              </section>
            )}

            {user.role === "admin" && (
              <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                <h2 className="font-bold text-brand-black">Administration</h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Review lawyer applications and manage registered users.
                </p>
                <Link
                  to="/admin"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-black hover:text-[#806600]"
                >
                  Open admin panel <span aria-hidden="true">→</span>
                </Link>
              </section>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-muted">
        {label}
      </p>
      <p className="mt-1.5 font-medium text-brand-black">{value || "Not provided"}</p>
    </div>
  );
}
