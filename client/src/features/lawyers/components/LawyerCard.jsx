import {
  legalCategories,
} from "../../search/data/searchOptions.js";

const categoryNames = Object.fromEntries(
  legalCategories.map((category) => [
    category.id,
    category.name,
  ])
);

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function LawyerCard({
  lawyer,
}) {
  return (
    <article className="rounded-2xl border border-brand-border bg-white p-5 transition hover:border-neutral-300 hover:shadow-md hover:shadow-black/5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        {/* Temporary profile visual */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-yellow-soft text-base font-extrabold text-brand-black">
          {getInitials(lawyer.displayName)}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + location */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-brand-black">
                {lawyer.displayName}
              </h3>

              <p className="mt-1 text-sm text-brand-muted">
                {lawyer.professionalTitle}
              </p>
            </div>

            <div className="shrink-0 text-sm sm:text-right">
              <p className="font-medium text-brand-black">
                {lawyer.officeCity}
              </p>

              <p className="mt-0.5 text-xs text-brand-muted">
                {lawyer.district}, {lawyer.province}
              </p>
            </div>
          </div>

          {/* Practice Areas */}
          <div className="mt-4 flex flex-wrap gap-2">
            {lawyer.practiceAreas?.map((area) => (
              <span
                key={area}
                className="rounded-full bg-brand-yellow-soft px-3 py-1 text-xs font-semibold text-[#705900]"
              >
                {categoryNames[area] || area}
              </span>
            ))}
          </div>

          {/* Details */}
          <div className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Languages
              </p>

              <p className="mt-1 text-brand-black">
                {lawyer.languages?.join(", ")}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Consultation
              </p>

              <p className="mt-1 text-brand-black">
                {lawyer.consultationModes?.join(", ")}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Experience
              </p>

              <p className="mt-1 text-brand-black">
                {lawyer.yearsOfPractice}{" "}
                {lawyer.yearsOfPractice === 1
                  ? "year"
                  : "years"}{" "}
                of practice
              </p>
            </div>

            {lawyer.match?.locationLabel && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Location Match
                </p>

                <p className="mt-1 text-brand-black">
                  {lawyer.match.locationLabel}
                </p>
              </div>
            )}
          </div>

          {lawyer.description && (
            <p className="mt-5 border-t border-brand-border pt-4 text-sm leading-6 text-brand-muted">
              {lawyer.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}