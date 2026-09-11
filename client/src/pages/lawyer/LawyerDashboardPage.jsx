import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiRequest } from "../../services/api.js";
import { Link } from "react-router-dom";

export default function LawyerDashboardPage() {
  const { user, token, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setError("");

        const data = await apiRequest(
          "/lawyers/me/profile",
          {
            token,
          }
        );

        // Supports either:
        // { profile: {...} }
        // or directly {...}
        setProfile(data.profile ?? data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoadingProfile(false);
      }
    }

    if (token) {
      loadProfile();
    }
  }, [token]);

  function getApprovalStatus() {
    if (!profile) {
      return null;
    }

    if (profile.isPublished) {
      return {
        label: "Approved",
        description:
          "Your profile is approved and visible in public lawyer search.",
        className:
          "border-green-200 bg-green-50 text-green-800",
      };
    }

    if (profile.rejectionReason) {
      return {
        label: "Rejected",
        description: profile.rejectionReason,
        className:
          "border-red-200 bg-red-50 text-red-800",
      };
    }

    return {
      label: "Pending Approval",
      description:
        "Your profile is waiting for administrator approval and is not yet visible publicly.",
      className:
        "border-yellow-200 bg-yellow-50 text-yellow-800",
    };
  }

  const approvalStatus = getApprovalStatus();

  if (loadingProfile) {
    return (
      <main className="min-h-[70vh] bg-brand-background">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <p className="text-brand-muted">
            Loading your lawyer profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-brand-background">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
              Lawyer Account
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-black">
              Lawyer Dashboard
            </h1>

            <p className="mt-2 text-brand-muted">
              Manage your FindMyLawyer profile.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
  <Link
    to="/lawyer/edit-profile"
    className="rounded-lg bg-brand-yellow px-5 py-3 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark"
  >
    Edit Profile
  </Link>

  <button
    type="button"
    onClick={logout}
    className="rounded-lg border border-brand-border bg-white px-5 py-3 text-sm font-semibold text-brand-black"
  >
    Logout
  </button>
</div>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {profile && (
          <>
            {/* Approval Status */}
            {approvalStatus && (
              <div
                className={`mt-8 rounded-2xl border p-5 ${approvalStatus.className}`}
              >
                <p className="font-bold">
                  {approvalStatus.label}
                </p>

                <p className="mt-1 text-sm leading-6">
                  {approvalStatus.description}
                </p>
              </div>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
              {/* Main Profile */}
              <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
                <div className="border-b border-brand-border pb-6">
                  <p className="text-sm text-brand-muted">
                    Lawyer Profile
                  </p>

                  <h2 className="mt-1 text-2xl font-extrabold text-brand-black">
                    {profile.displayName}
                  </h2>

                  <p className="mt-1 text-brand-muted">
                    {profile.professionalTitle ||
                      "Attorney-at-Law"}
                  </p>
                </div>

                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <ProfileItem
                    label="Email"
                    value={profile.email || user?.email}
                  />

                  <ProfileItem
                    label="Phone"
                    value={profile.phone}
                  />

                  <ProfileItem
                    label="Province"
                    value={profile.province}
                  />

                  <ProfileItem
                    label="District"
                    value={profile.district}
                  />

                  <ProfileItem
                    label="Office City"
                    value={profile.officeCity}
                  />

                  <ProfileItem
                    label="Years of Practice"
                    value={
                      profile.yearsOfPractice !==
                      undefined
                        ? `${profile.yearsOfPractice} years`
                        : null
                    }
                  />

                  <ProfileItem
                    label="Primary Practice Area"
                    value={profile.primaryPracticeArea}
                  />

                  <ProfileItem
                    label="Accepting New Clients"
                    value={
                      profile.acceptingNewClients
                        ? "Yes"
                        : "No"
                    }
                  />
                </div>

                <div className="mt-8 border-t border-brand-border pt-7">
                  <h3 className="font-bold text-brand-black">
                    About
                  </h3>

                  <p className="mt-3 leading-7 text-brand-muted">
                    {profile.description ||
                      "No description added yet."}
                  </p>
                </div>
              </section>

              {/* Additional Details */}
              <aside className="space-y-6">
                <DetailsCard
                  title="Practice Areas"
                  items={profile.practiceAreas}
                />

                <DetailsCard
                  title="Languages"
                  items={profile.languages}
                />

                <DetailsCard
                  title="Consultation Modes"
                  items={profile.consultationModes}
                />

                <DetailsCard
                  title="Sub Areas"
                  items={profile.subAreas}
                />
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-muted">
        {label}
      </p>

      <p className="mt-1 font-medium text-brand-black">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function DetailsCard({ title, items }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
      <h3 className="font-bold text-brand-black">
        {title}
      </h3>

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
        <p className="mt-3 text-sm text-brand-muted">
          Not provided
        </p>
      )}
    </div>
  );
}