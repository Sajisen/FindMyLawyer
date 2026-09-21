import { Link, useLocation } from "react-router-dom";

import SaveLawyerButton from "./SaveLawyerButton.jsx";
import LawyerAvatar from "./LawyerAvatar.jsx";
import { legalCategories } from "../../search/data/searchOptions.js";

const fallbackCategoryNames = Object.fromEntries(
  legalCategories.map((category) => [category.id, category.name])
);

function getPracticeAreas(lawyer) {
  return Array.from(
    new Set(
      [lawyer.primaryPracticeArea, ...(lawyer.practiceAreas || [])].filter(
        Boolean
      )
    )
  );
}

function getExperienceLabel(years) {
  if (years === undefined || years === null) {
    return "Not provided";
  }

  return `${years} ${years === 1 ? "year" : "years"} of practice`;
}

function ProfileLink({ lawyer, returnTo, onOpenProfile, className, children }) {
  return (
    <Link
      to={`/lawyers/${lawyer._id}`}
      state={{ from: returnTo }}
      onClick={onOpenProfile}
      className={className}
    >
      {children}
    </Link>
  );
}

export default function LawyerCard({
  lawyer,
  categories = [],
  variant = "list",
  onOpenProfile,
}) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const categoryNames = {
    ...fallbackCategoryNames,
    ...Object.fromEntries(
      categories.map((category) => [category.id, category.name])
    ),
  };
  const practiceAreas = getPracticeAreas(lawyer);

  if (variant === "grid") {
    const visibleAreas = practiceAreas.slice(0, 2);
    const remainingAreaCount = Math.max(0, practiceAreas.length - visibleAreas.length);

    return (
      <article className="group flex min-h-[380px] flex-col rounded-[20px] border border-brand-border bg-white p-5 shadow-[0_1px_0_rgba(17,17,17,0.02)] transition duration-300 hover:-translate-y-1 hover:border-[#ddd7c7] hover:shadow-[0_22px_50px_-30px_rgba(17,17,17,0.36)] sm:p-[22px]">
        <div className="flex items-start justify-between gap-4">
          <LawyerAvatar lawyer={lawyer} />
          <SaveLawyerButton lawyer={lawyer} iconOnly />
        </div>

        <div className="mt-5 min-w-0">
          <ProfileLink
            lawyer={lawyer}
            returnTo={returnTo}
            onOpenProfile={onOpenProfile}
            className="text-xl font-extrabold tracking-tight text-brand-black transition group-hover:text-[#6b5600]"
          >
            {lawyer.displayName}
          </ProfileLink>
          <p className="mt-1 text-sm text-brand-muted">
            {lawyer.professionalTitle || "Attorney-at-Law"}
          </p>

          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-black">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-brand-muted" aria-hidden="true">
              <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {[lawyer.officeCity, lawyer.district].filter(Boolean).join(", ") || "Location not provided"}
          </p>
        </div>

        {visibleAreas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleAreas.map((area) => (
              <span
                key={area}
                className="rounded-full bg-brand-yellow-soft px-3 py-1 text-xs font-semibold text-[#705900]"
              >
                {categoryNames[area] || area}
              </span>
            ))}
            {remainingAreaCount > 0 && (
              <span className="rounded-full bg-brand-background px-3 py-1 text-xs font-semibold text-brand-muted">
                +{remainingAreaCount}
              </span>
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-brand-border pt-5 text-sm">
          <CompactDetail
            label="Experience"
            value={getExperienceLabel(lawyer.yearsOfPractice)}
          />
          <CompactDetail
            label="Languages"
            value={lawyer.languages?.length ? lawyer.languages.join(", ") : "Not provided"}
          />
          {lawyer.match?.locationLabel && (
            <CompactDetail label="Location match" value={lawyer.match.locationLabel} />
          )}
          <CompactDetail
            label="Consultation"
            value={
              lawyer.consultationModes?.length
                ? lawyer.consultationModes.join(", ")
                : "Not provided"
            }
          />
        </div>

        <div className="mt-auto border-t border-brand-border pt-5">
          <ProfileLink
            lawyer={lawyer}
            returnTo={returnTo}
            onOpenProfile={onOpenProfile}
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-black transition hover:text-[#806600]"
          >
            View full profile
            <span aria-hidden="true">→</span>
          </ProfileLink>
        </div>
      </article>
    );
  }

  return (
    <article className="group rounded-[20px] border border-brand-border bg-white p-5 shadow-[0_1px_0_rgba(17,17,17,0.02)] transition duration-300 hover:border-[#ddd7c7] hover:shadow-[0_22px_50px_-30px_rgba(17,17,17,0.32)] sm:p-[22px]">
      <div className="flex flex-col gap-5 sm:flex-row">
        <LawyerAvatar lawyer={lawyer} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <ProfileLink
                lawyer={lawyer}
                returnTo={returnTo}
                onOpenProfile={onOpenProfile}
                className="text-xl font-extrabold tracking-tight text-brand-black transition hover:text-[#806600]"
              >
                {lawyer.displayName}
              </ProfileLink>

              <p className="mt-1 text-sm text-brand-muted">
                {lawyer.professionalTitle || "Attorney-at-Law"}
              </p>
            </div>

            <div className="shrink-0 text-sm sm:text-right">
              <p className="font-semibold text-brand-black">
                {lawyer.officeCity || "Location not provided"}
              </p>

              {(lawyer.district || lawyer.province) && (
                <p className="mt-0.5 text-xs text-brand-muted">
                  {[lawyer.district, lawyer.province].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          {practiceAreas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {practiceAreas.slice(0, 3).map((area) => (
                <span
                  key={area}
                  className="rounded-full bg-brand-yellow-soft px-3 py-1 text-xs font-semibold text-[#705900]"
                >
                  {categoryNames[area] || area}
                </span>
              ))}
              {practiceAreas.length > 3 && (
                <span className="rounded-full bg-brand-background px-3 py-1 text-xs font-semibold text-brand-muted">
                  +{practiceAreas.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <CompactDetail
              label="Languages"
              value={lawyer.languages?.length ? lawyer.languages.join(", ") : "Not provided"}
            />
            <CompactDetail
              label="Consultation"
              value={
                lawyer.consultationModes?.length
                  ? lawyer.consultationModes.join(", ")
                  : "Not provided"
              }
            />
            <CompactDetail
              label="Experience"
              value={getExperienceLabel(lawyer.yearsOfPractice)}
            />
            {lawyer.match?.locationLabel && (
              <CompactDetail label="Location match" value={lawyer.match.locationLabel} />
            )}
          </div>

          {lawyer.description && (
            <p className="mt-5 border-t border-brand-border pt-4 text-sm leading-6 text-brand-muted">
              {lawyer.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-brand-border pt-4">
            <ProfileLink
              lawyer={lawyer}
              returnTo={returnTo}
              onOpenProfile={onOpenProfile}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-yellow-soft px-4 py-2.5 text-sm font-bold text-brand-black transition hover:-translate-y-px hover:bg-[#ffed9b]"
            >
              View profile
              <span aria-hidden="true">→</span>
            </ProfileLink>
            <SaveLawyerButton lawyer={lawyer} compact />
          </div>
        </div>
      </div>
    </article>
  );
}

function CompactDetail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-muted">
        {label}
      </p>
      <p className="mt-1 text-sm leading-5 text-brand-black">{value}</p>
    </div>
  );
}
