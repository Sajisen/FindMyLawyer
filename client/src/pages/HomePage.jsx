import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import SelectControl from "../components/ui/SelectControl.jsx";
import LocationAutocomplete from "../features/search/components/LocationAutocomplete.jsx";
import useLegalCategories from "../features/search/hooks/useLegalCategories.js";

const featuredPracticeAreaDefaults = [
  {
    id: "property",
    name: "Land & Property",
    description:
      "Property ownership, boundary disputes, transfers and related matters.",
  },
  {
    id: "family",
    name: "Family & Matrimonial",
    description:
      "Family disputes, maintenance, custody and matrimonial matters.",
  },
  {
    id: "criminal",
    name: "Criminal Law",
    description:
      "Legal assistance relating to criminal matters and proceedings.",
  },
  {
    id: "employment",
    name: "Employment & Labour",
    description:
      "Employment disputes, termination, workplace and labour matters.",
  },
  {
    id: "business",
    name: "Business & Commercial",
    description:
      "Commercial agreements, businesses and related legal matters.",
  },
  {
    id: "civil",
    name: "Civil Disputes",
    description:
      "Civil claims, compensation and disputes between parties.",
  },
];

function PracticeAreaIcon({ areaId }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    className: "h-5 w-5",
    "aria-hidden": true,
  };

  if (areaId === "property") {
    return (
      <svg {...commonProps}>
        <path
          d="M4 20V9.5L12 4l8 5.5V20M8 20v-6h8v6M3 20h18"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (areaId === "family") {
    return (
      <svg {...commonProps}>
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.65" />
        <path
          d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.8M16.5 14a5 5 0 0 1 4 4.9V20"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (areaId === "criminal") {
    return (
      <svg {...commonProps}>
        <path
          d="M12 3 19 6v5.2c0 4.2-2.7 7.7-7 9.8-4.3-2.1-7-5.6-7-9.8V6l7-3Z"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
        <path
          d="m9.2 12 1.8 1.8 3.8-4"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (areaId === "employment") {
    return (
      <svg {...commonProps}>
        <path
          d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7M4 7h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
        <path d="M3 12h18M10 12v2h4v-2" stroke="currentColor" strokeWidth="1.65" />
      </svg>
    );
  }

  if (areaId === "business") {
    return (
      <svg {...commonProps}>
        <path
          d="M5 20V10M12 20V4M19 20v-7M3 20h18"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
        />
        <path
          d="m4 7 5-3 4 3 7-4"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path
        d="M12 4v16M5 7h14M7 7l-3 6h6L7 7ZM17 7l-3 6h6l-3-6ZM8 20h8"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading, error: categoriesError } =
    useLegalCategories();

  const featuredPracticeAreas = featuredPracticeAreaDefaults
    .map((area) => {
      const configuredCategory = categories.find(
        (category) => category.id === area.id
      );

      return {
        ...area,
        configured: Boolean(configuredCategory),
        name: configuredCategory?.name || area.name,
        description: configuredCategory?.description || area.description,
      };
    })
    .filter(
      (area) => categoriesLoading || categoriesError || area.configured
    );

  const [quickSearch, setQuickSearch] = useState({
    category: "",
    location: "",
    locationId: "",
  });

  function updateQuickSearch(field, value) {
    setQuickSearch((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleLocationChange(value) {
    setQuickSearch((previous) => ({
      ...previous,
      location: value,
      locationId: "",
    }));
  }

  function handleLocationSelect(location) {
    if (!location) {
      return;
    }

    setQuickSearch((previous) => ({
      ...previous,
      location: location.city,
      locationId: location.id,
    }));
  }

  function handleQuickSearch(event) {
    event.preventDefault();

    const hasMainFilter = Boolean(
      quickSearch.category || quickSearch.locationId
    );
    const hasUnselectedLocation = Boolean(
      quickSearch.location.trim() && !quickSearch.locationId
    );

    if (!hasMainFilter || hasUnselectedLocation) {
      return;
    }

    const params = new URLSearchParams({ search: "1" });

    if (quickSearch.category) {
      params.set("category", quickSearch.category);
    }

    if (quickSearch.locationId) {
      params.set("location", quickSearch.location.trim());
      params.set("locationId", quickSearch.locationId);
    }

    navigate(`/find-lawyers?${params.toString()}`);
  }

  const quickSearchHasMainFilter = Boolean(
    quickSearch.category || quickSearch.locationId
  );
  const quickSearchHasUnselectedLocation = Boolean(
    quickSearch.location.trim() && !quickSearch.locationId
  );
  const canQuickSearch =
    quickSearchHasMainFilter && !quickSearchHasUnselectedLocation;

  return (
    <main className="overflow-hidden bg-white">
      {/* NARROW SEARCH BANNER */}
      <section className="border-b border-[#f1df94] bg-[#fff8dc]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-2.5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-[13px] font-semibold text-[#4d4631]">
            Search verified public lawyer profiles by legal area and preferred
            location.
          </p>

          <Link
            to="/find-lawyers"
            className="group inline-flex w-fit shrink-0 items-center gap-1.5 text-[13px] font-bold text-brand-black transition hover:text-[#755b00]"
          >
            Browse lawyers
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* HERO */}
      <section className="relative bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_74%_14%,rgba(245,197,24,0.11),transparent_38%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:px-8 lg:py-[74px]">
          <div className="max-w-[640px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ead88e] bg-[#fffaf0] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow-dark" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#725b00]">
                Lawyer discovery in Sri Lanka
              </p>
            </div>

            <h1 className="mt-5 max-w-[620px] text-[2.8rem] font-black leading-[1.02] tracking-[-0.045em] text-brand-black sm:text-[3.25rem] lg:text-[3.55rem]">
              Find the legal help you need
            </h1>

            <p className="mt-5 max-w-[560px] text-base leading-7 text-brand-muted sm:text-[1.05rem]">
              Search Attorneys-at-Law by area of practice and location, then
              review clear public profiles that match your preferences.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/find-lawyers"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-yellow px-5 font-bold text-brand-black shadow-[0_10px_28px_-16px_rgba(120,90,0,0.75)] transition hover:-translate-y-px hover:bg-brand-yellow-dark"
              >
                Find a Lawyer
                <ArrowIcon />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-border bg-white px-5 font-semibold text-brand-black transition hover:border-neutral-400 hover:bg-brand-background"
              >
                How It Works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-brand-border pt-5 text-xs font-medium text-brand-muted">
              <span className="inline-flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow-soft text-[10px] font-black text-[#755b00]">
                  ✓
                </span>
                No account needed to search
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow-soft text-[10px] font-black text-[#755b00]">
                  ✓
                </span>
                Controlled legal categories
              </span>
            </div>
          </div>

          {/* QUICK SEARCH */}
          <div className="mx-auto w-full max-w-[470px] lg:justify-self-end">
            <form
              onSubmit={handleQuickSearch}
              className="relative overflow-hidden rounded-[24px] border border-[#e7e3d9] bg-white p-6 shadow-[0_28px_70px_-34px_rgba(20,20,20,0.34)] sm:p-7"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-yellow via-[#ffd94f] to-[#f2b800]" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#826800]">
                    Quick search
                  </p>

                  <h2 className="mt-1.5 text-[1.65rem] font-extrabold tracking-[-0.025em] text-brand-black">
                    Start with what you know
                  </h2>
                </div>

                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-soft text-[#7a6100] sm:flex">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.7" />
                    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="home-practice-area"
                  className="mb-2 block text-sm font-semibold text-brand-black"
                >
                  Area of Practice
                </label>

                <SelectControl
                  id="home-practice-area"
                  value={quickSearch.category}
                  onChange={(event) =>
                    updateQuickSearch("category", event.target.value)
                  }
                >
                  <option value="">Select an area, or use location below</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </SelectControl>
              </div>

              <div className="mt-[18px]">
                <label
                  htmlFor="home-location"
                  className="mb-2 block text-sm font-semibold text-brand-black"
                >
                  Preferred Location
                  <span className="ml-1 font-normal text-brand-muted">
                    (optional)
                  </span>
                </label>

                <LocationAutocomplete
                  id="home-location"
                  value={quickSearch.location}
                  onChange={handleLocationChange}
                  onSelect={handleLocationSelect}
                  placeholder="Start typing a city"
                />

                {quickSearchHasUnselectedLocation && (
                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    Select a location from the suggestions to use it.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canQuickSearch}
                className="mt-[22px] flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-yellow px-5 font-bold text-brand-black transition hover:bg-brand-yellow-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/40 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Search Lawyers
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* PRACTICE AREAS */}
      <section className="relative border-y border-brand-border bg-brand-background py-16 lg:py-[74px]">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand-yellow/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[680px]">
              <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#806600]">
                Common legal areas
              </p>

              <h2 className="mt-3 text-[2rem] font-extrabold tracking-[-0.035em] text-brand-black sm:text-[2.35rem]">
                Browse by area of practice
              </h2>

              <p className="mt-3 max-w-[620px] text-base leading-7 text-brand-muted">
                Start with the type of legal help you need. Each area opens a
                focused lawyer search with the category already applied.
              </p>
            </div>

            <Link
              to="/find-lawyers"
              className="group inline-flex w-fit items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-bold text-brand-black shadow-sm transition hover:border-neutral-400 hover:shadow-md"
            >
              View all search options
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPracticeAreas.map((area, index) => (
              <Link
                to={`/find-lawyers?category=${area.id}&search=1`}
                key={area.id}
                className="group relative flex min-h-[218px] flex-col overflow-hidden rounded-[20px] border border-[#e5e2d9] bg-white p-[22px] transition duration-300 hover:-translate-y-1 hover:border-[#dfc760] hover:shadow-[0_24px_55px_-30px_rgba(17,17,17,0.42)] focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/40"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-yellow/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#efe1a2] bg-[#fff9df] text-[#715a00] transition group-hover:border-brand-yellow group-hover:bg-brand-yellow-soft">
                    <PracticeAreaIcon areaId={area.id} />
                  </div>

                  <span className="text-[11px] font-extrabold tracking-[0.12em] text-neutral-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="text-[1.08rem] font-extrabold tracking-[-0.018em] text-brand-black">
                    {area.name}
                  </h3>

                  <p className="mt-2.5 text-sm leading-6 text-brand-muted">
                    {area.description}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-brand-border pt-4">
                  <span className="text-xs font-bold text-brand-black">
                    Explore lawyers
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-background text-brand-muted transition duration-300 group-hover:bg-brand-black group-hover:text-white">
                    <ArrowIcon />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative overflow-hidden bg-brand-black py-16 text-white lg:py-[74px]"
      >
        <div className="pointer-events-none absolute -left-28 top-0 h-64 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[650px]">
              <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-brand-yellow">
                How It Works
              </p>

              <h2 className="mt-3 text-[2rem] font-extrabold tracking-[-0.035em] sm:text-[2.35rem]">
                A straightforward path to a useful profile
              </h2>
            </div>

            <p className="max-w-[390px] text-sm leading-6 text-neutral-400">
              Start broad, refine only when useful, and review the information
              you need before deciding who to contact.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Choose a starting point",
                text: "Start with an area of practice, a preferred location, or both.",
              },
              {
                number: "02",
                title: "Refine the shortlist",
                text: "Use language, consultation method and experience when those preferences matter.",
              },
              {
                number: "03",
                title: "Review lawyer profiles",
                text: "Compare relevant public information and decide who you want to contact.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="rounded-[18px] border border-white/10 bg-white/[0.035] p-[22px] transition hover:border-white/20 hover:bg-white/[0.055]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-yellow/30 bg-brand-yellow/10 text-xs font-extrabold text-brand-yellow">
                  {step.number}
                </div>
                <h3 className="mt-5 text-[1.08rem] font-bold tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-neutral-400">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-white py-16 lg:py-[72px]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#806600]">
              About FindMyLawyer
            </p>

            <h2 className="mt-3 max-w-lg text-[2rem] font-extrabold tracking-[-0.035em] text-brand-black sm:text-[2.35rem]">
              A clearer starting point for finding legal help
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[18px] border border-brand-border bg-brand-background p-5">
              <p className="text-sm leading-6 text-brand-muted">
                FindMyLawyer is a Sri Lankan lawyer-discovery prototype designed
                to make the first step of searching for legal assistance easier.
              </p>
            </div>

            <div className="rounded-[18px] border border-brand-border bg-brand-background p-5">
              <p className="text-sm leading-6 text-brand-muted">
                The platform supports lawyer discovery and routing. It does not
                replace professional legal advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-brand-border bg-brand-background py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[24px] bg-brand-yellow px-7 py-8 shadow-[0_22px_60px_-35px_rgba(90,70,0,0.5)] sm:px-9 lg:flex lg:items-center lg:justify-between lg:px-10">
            <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full border-[28px] border-white/20" />

            <div className="relative max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-black/60">
                Ready when you are
              </p>
              <h2 className="mt-2 text-[1.85rem] font-extrabold tracking-[-0.03em] text-brand-black">
                Start your lawyer search
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-black/65">
                Choose a legal area or preferred location and explore relevant
                public lawyer profiles.
              </p>
            </div>

            <Link
              to="/find-lawyers"
              className="relative mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-black px-5 font-bold text-white transition hover:-translate-y-px hover:bg-brand-dark lg:mt-0"
            >
              Find Lawyers
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
