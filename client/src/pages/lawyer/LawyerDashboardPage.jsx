import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth.js";
import { apiRequest } from "../../services/api.js";
import useLegalCategories from "../../features/search/hooks/useLegalCategories.js";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function LawyerDashboardPage() {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const profileNotice = location.state?.profileNotice || "";
  const { categories } = useLegalCategories();
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setError("");
        const data = await apiRequest("/lawyers/me/profile", { token });

        if (!cancelled) {
          setProfile(data.profile ?? data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
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

  function getApprovalStatus() {
    if (!profile) {
      return null;
    }

    if (profile.isPublished && profile.pendingProfileChanges) {
      return {
        label: "Profile update in review",
        description:
          "Your approved public profile is still active. The requested professional changes will appear only after an administrator approves them.",
        className: "border-amber-200 bg-amber-50 text-amber-900",
      };
    }

    if (profile.isPublished && profile.profileUpdateRejectionReason) {
      return {
        label: "Recent profile update was not approved",
        description: `${profile.profileUpdateRejectionReason} Your previously approved public profile remains active.`,
        className: "border-red-200 bg-red-50 text-red-800",
      };
    }

    if (profile.isPublished) {
      return {
        label: "Approved",
        description:
          "Your profile is approved and visible in public lawyer search.",
        className: "border-green-200 bg-green-50 text-green-800",
      };
    }

    if (profile.rejectionReason) {
      return {
        label: "Changes required",
        description: profile.rejectionReason,
        className: "border-red-200 bg-red-50 text-red-800",
      };
    }

    return {
      label: "Pending approval",
      description:
        "Your profile is waiting for administrator approval and is not yet visible publicly.",
      className: "border-yellow-200 bg-yellow-50 text-yellow-800",
    };
  }

  const approvalStatus = getApprovalStatus();

  if (loadingProfile) {
    return (
      <main className="min-h-[70vh] bg-brand-background">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
          <p className="text-brand-muted">Loading your lawyer profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-background">
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
            Lawyer account
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
                Your lawyer profile
              </h1>
              <p className="mt-2 text-sm leading-6 text-brand-muted sm:text-base">
                Review your public information and update your professional profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {profile?.isPublished && (
                <Link
                  to={`/lawyers/${profile._id}`}
                  className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-bold text-brand-black transition hover:bg-brand-background"
                >
                  View public profile
                </Link>
              )}
              <Link to="/lawyer/verification" className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-bold text-brand-black">Verification documents</Link>
              <Link
                to="/profile/edit"
                className="rounded-xl bg-brand-yellow px-5 py-2.5 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark"
              >
                Edit profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
        {profileNotice && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
            <p>{profileNotice}</p>
            <button
              type="button"
              onClick={() => navigate(location.pathname, { replace: true, state: null })}
              className="font-bold text-green-900"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {profile && (
          <>
            {approvalStatus && (
              <div className={`rounded-2xl border p-5 ${approvalStatus.className}`}>
                <p className="font-bold">{approvalStatus.label}</p>
                <p className="mt-1 text-sm leading-6">{approvalStatus.description}</p>
              </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
              <section className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-brand-yellow-soft text-3xl font-extrabold text-brand-black">
                    {getInitials(profile.displayName)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-muted">
                      Current profile
                    </p>
                    <h2 className="mt-2 text-2xl font-extrabold text-brand-black">
                      {profile.displayName}
                    </h2>
                    <p className="mt-1 text-brand-muted">
                      {profile.professionalTitle || "Attorney-at-Law"}
                    </p>
                    <p className="mt-3 text-sm font-medium text-brand-black">
                      {[profile.officeCity, profile.district, profile.province]
                        .filter(Boolean)
                        .join(", ") || "Location not provided"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 border-t border-brand-border pt-7 sm:grid-cols-2">
                  <ProfileItem label="Account email" value={user?.email} />
                  <ProfileItem label="Public contact email" value={profile.email || user?.email} />
                  <ProfileItem label="Phone" value={profile.phone} />
                  <ProfileItem
                    label="Years of practice"
                    value={
                      profile.yearsOfPractice !== undefined
                        ? `${profile.yearsOfPractice} years`
                        : null
                    }
                  />
                  <ProfileItem
                    label="Primary practice area"
                    value={
                      categoryNames[profile.primaryPracticeArea] ||
                      profile.primaryPracticeArea
                    }
                  />
                  <ProfileItem
                    label="Accepting new clients"
                    value={profile.acceptingNewClients ? "Yes" : "No"}
                  />
                </div>

                <div className="mt-8 border-t border-brand-border pt-7">
                  <h3 className="font-bold text-brand-black">About</h3>
                  <p className="mt-3 leading-7 text-brand-muted">
                    {profile.description || "No description added yet."}
                  </p>
                </div>
              </section>

              <aside className="space-y-5">
                {profile.pendingProfileChanges && (
                  <PendingChangesCard
                    pending={profile.pendingProfileChanges}
                    categoryNames={categoryNames}
                  />
                )}

                <DetailsCard
                  title="Practice areas"
                  items={profile.practiceAreas?.map(
                    (area) => categoryNames[area] || area
                  )}
                />
                <DetailsCard title="Languages" items={profile.languages} />
                <DetailsCard
                  title="Consultation modes"
                  items={profile.consultationModes}
                />
                <DetailsCard title="Areas of focus" items={profile.subAreas} />
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function PendingChangesCard({ pending, categoryNames }) {
  const entries = [];

  if (pending.displayName) entries.push(["Display name", pending.displayName]);
  if (pending.professionalTitle)
    entries.push(["Professional title", pending.professionalTitle]);
  if (pending.officeCity)
    entries.push([
      "Office location",
      [pending.officeCity, pending.district, pending.province]
        .filter(Boolean)
        .join(", "),
    ]);
  if (pending.primaryPracticeArea)
    entries.push([
      "Primary practice area",
      categoryNames[pending.primaryPracticeArea] || pending.primaryPracticeArea,
    ]);
  if (pending.practiceAreas)
    entries.push([
      "Practice areas",
      pending.practiceAreas.map((area) => categoryNames[area] || area).join(", "),
    ]);
  if (pending.yearsOfPractice !== undefined)
    entries.push(["Years of practice", String(pending.yearsOfPractice)]);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="font-bold text-amber-950">Changes awaiting review</h3>
      <p className="mt-2 text-sm leading-6 text-amber-900/80">
        These changes are not public yet.
      </p>
      {entries.length > 0 && (
        <div className="mt-4 space-y-3">
          {entries.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900/60">
                {label}
              </p>
              <p className="mt-1 text-sm font-medium text-amber-950">{value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-muted">
        {label}
      </p>
      <p className="mt-1.5 font-medium text-brand-black">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function DetailsCard({ title, items }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
      <h3 className="font-bold text-brand-black">{title}</h3>

      {items?.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full bg-brand-background px-3 py-1.5 text-sm text-brand-black"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-brand-muted">Not provided</p>
      )}
    </div>
  );
}
