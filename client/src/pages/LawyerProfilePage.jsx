import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import SaveLawyerButton from "../features/lawyers/components/SaveLawyerButton.jsx";
import { getLawyerById } from "../features/lawyers/lawyerApi.js";
import useLegalCategories from "../features/search/hooks/useLegalCategories.js";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function LawyerProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = location.state?.from || "/find-lawyers";
  const hasHistoryReturn = Boolean(location.state?.from);
  const returnLabel = returnTo.startsWith("/saved-lawyers")
    ? "Back to saved lawyers"
    : "Back to lawyer search";
  const { categories } = useLegalCategories();
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryNames = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [category.id, category.name])
      ),
    [categories]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLawyer() {
      try {
        setLoading(true);
        setError("");
        const data = await getLawyerById(id);

        if (!cancelled) {
          setLawyer(data.lawyer || null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLawyer(null);
          setError(
            requestError.message || "Unable to load this lawyer profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLawyer();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleBack() {
    if (hasHistoryReturn) {
      navigate(-1);
      return;
    }

    navigate(returnTo);
  }

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-brand-background">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-brand-border bg-white p-8 shadow-sm">
            <div className="h-6 w-44 animate-pulse rounded bg-neutral-200" />
            <div className="mt-8 flex gap-6">
              <div className="h-28 w-28 shrink-0 animate-pulse rounded-3xl bg-neutral-100" />
              <div className="flex-1">
                <div className="h-9 w-72 max-w-full animate-pulse rounded bg-neutral-200" />
                <div className="mt-4 h-5 w-44 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !lawyer) {
    return (
      <main className="min-h-[70vh] bg-brand-background">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-brand-border bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-extrabold text-brand-black">
              Lawyer profile unavailable
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-brand-muted">
              {error || "This profile is not currently available."}
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-6 inline-flex rounded-xl bg-brand-yellow-soft px-5 py-3 text-sm font-bold text-brand-black transition hover:bg-[#ffed9b]"
            >
              {returnLabel}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const primaryCategory =
    categoryNames[lawyer.primaryPracticeArea] || lawyer.primaryPracticeArea;
  const practiceAreas = Array.from(
    new Set(
      [lawyer.primaryPracticeArea, ...(lawyer.practiceAreas || [])].filter(
        Boolean
      )
    )
  );

  return (
    <main className="min-h-screen bg-brand-background">
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-muted transition hover:text-brand-black"
          >
            <span aria-hidden="true">←</span>
            {returnLabel}
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-brand-border bg-white shadow-sm">
          <div className="relative border-b border-brand-border bg-[linear-gradient(135deg,#fffdf3_0%,#ffffff_58%)] p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border border-brand-yellow/30 bg-brand-yellow-soft text-3xl font-extrabold text-brand-black shadow-sm sm:h-32 sm:w-32">
                  {getInitials(lawyer.displayName)}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
                      {lawyer.displayName}
                    </h1>
                    {lawyer.acceptingNewClients && (
                      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                        Accepting new clients
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-base font-medium text-brand-muted">
                    {lawyer.professionalTitle || "Attorney-at-Law"}
                  </p>

                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-black">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4 text-brand-muted"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <circle
                        cx="12"
                        cy="10"
                        r="2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                    {[lawyer.officeCity, lawyer.district, lawyer.province]
                      .filter(Boolean)
                      .join(", ") || "Location not provided"}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <SaveLawyerButton lawyer={lawyer} />
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:p-10">
            <div className="min-w-0">
              <section>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#806600]">
                  Primary practice area
                </p>
                <h2 className="mt-2 text-2xl font-bold text-brand-black">
                  {primaryCategory || "Not specified"}
                </h2>

                {practiceAreas.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {practiceAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-brand-yellow-soft px-3 py-1.5 text-sm font-semibold text-[#705900]"
                      >
                        {categoryNames[area] || area}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-8 border-t border-brand-border pt-8">
                <h2 className="text-lg font-bold text-brand-black">About</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-brand-muted">
                  {lawyer.description ||
                    "No additional profile description has been provided."}
                </p>
              </section>

              {lawyer.subAreas?.length > 0 && (
                <section className="mt-8 border-t border-brand-border pt-8">
                  <h2 className="text-lg font-bold text-brand-black">
                    Areas of focus
                  </h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {lawyer.subAreas.map((area) => (
                      <li
                        key={area}
                        className="rounded-xl border border-brand-border bg-brand-background px-4 py-3 text-sm font-medium text-brand-black"
                      >
                        {area}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-brand-yellow/40 bg-brand-yellow-soft/45 p-5">
                <h2 className="text-base font-bold text-brand-black">
                  Contact information
                </h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Contact this lawyer directly using their published details.
                </p>

                <div className="mt-5 space-y-3">
                  <ContactItem
                    label="Phone"
                    value={lawyer.phone}
                    href={lawyer.phone ? `tel:${lawyer.phone}` : null}
                    icon="phone"
                  />
                  <ContactItem
                    label="Email"
                    value={lawyer.email}
                    href={lawyer.email ? `mailto:${lawyer.email}` : null}
                    icon="email"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-brand-border bg-white p-5">
                <h2 className="text-base font-bold text-brand-black">
                  Profile details
                </h2>
                <div className="mt-5 space-y-5">
                  <ProfileDetail
                    label="Experience"
                    value={
                      lawyer.yearsOfPractice !== undefined &&
                      lawyer.yearsOfPractice !== null
                        ? `${lawyer.yearsOfPractice} ${
                            lawyer.yearsOfPractice === 1 ? "year" : "years"
                          } of practice`
                        : null
                    }
                  />
                  <ProfileDetail
                    label="Languages"
                    value={lawyer.languages?.join(", ")}
                  />
                  <ProfileDetail
                    label="Consultation"
                    value={lawyer.consultationModes?.join(", ")}
                  />
                  <ProfileDetail
                    label="New clients"
                    value={
                      lawyer.acceptingNewClients
                        ? "Currently accepting"
                        : "Not currently accepting"
                    }
                  />
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactItem({ label, value, href, icon }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/80 p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
        {label}
      </p>
      {value && href ? (
        <a
          href={href}
          className="mt-1.5 flex items-center gap-2 break-all text-sm font-semibold text-brand-black transition hover:text-[#806600]"
        >
          <ContactIcon type={icon} />
          {value}
        </a>
      ) : (
        <p className="mt-1.5 text-sm text-brand-muted">Not provided</p>
      )}
    </div>
  );
}

function ContactIcon({ type }) {
  if (type === "email") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
        <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M7.3 4.8 9.7 8c.4.5.3 1.2-.1 1.7l-1.2 1.2a14.8 14.8 0 0 0 4.7 4.7l1.2-1.2c.5-.4 1.2-.5 1.7-.1l3.2 2.4c.6.4.8 1.2.4 1.8l-.8 1.3c-.4.7-1.2 1.1-2 1-7.2-.9-12.7-6.4-13.6-13.6-.1-.8.3-1.6 1-2l1.3-.8c.6-.4 1.4-.2 1.8.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileDetail({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-6 text-brand-black">
        {value || "Not provided"}
      </p>
    </div>
  );
}
