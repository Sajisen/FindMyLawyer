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
    <main>
      {/* NARROW SEARCH BANNER */}
      <section className="border-b border-yellow-200 bg-brand-yellow-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-sm font-medium text-brand-black">
            Search lawyer profiles by legal area and preferred location.
          </p>

          <Link
            to="/find-lawyers"
            className="w-fit shrink-0 text-sm font-bold text-brand-black transition hover:underline"
          >
            Browse lawyers →
          </Link>
        </div>
      </section>

      {/* HERO */}
      <section className="overflow-visible bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#806600]">
              Lawyer discovery in Sri Lanka
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-brand-black sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              Find the legal help you need
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-brand-muted sm:text-lg">
              Search Attorneys-at-Law by area of practice and location, then
              review profiles that match your preferences.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/find-lawyers"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-yellow px-6 font-bold text-brand-black transition hover:bg-brand-yellow-dark"
              >
                Find a Lawyer
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-brand-border bg-white px-6 font-semibold text-brand-black transition hover:border-neutral-400"
              >
                How It Works
              </a>
            </div>
          </div>

          {/* QUICK SEARCH */}
          <div className="mx-auto w-full max-w-lg">
            <form
              onSubmit={handleQuickSearch}
              className="rounded-3xl border border-brand-border bg-white p-6 shadow-xl shadow-black/5 sm:p-8"
            >
              <div>
                <p className="text-sm font-medium text-brand-muted">
                  Quick Search
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-brand-black">
                  Start with what you know
                </h2>
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

              <div className="mt-5">
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
                className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-yellow px-5 font-bold text-brand-black transition hover:bg-brand-yellow-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/40 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Search Lawyers
              </button>

            </form>
          </div>
        </div>
      </section>

      {/* PRACTICE AREAS */}
      <section className="border-t border-brand-border bg-brand-background py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
              Common legal areas
            </p>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
              Browse by area of practice
            </h2>

            <p className="mt-4 text-base leading-7 text-brand-muted sm:text-lg">
              Choose a category to open Find Lawyers with that filter already
              applied and the matching profiles loaded.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPracticeAreas.map((area) => (
              <Link
                to={`/find-lawyers?category=${area.id}&search=1`}
                key={area.id}
                className="group rounded-2xl border border-brand-border bg-white p-6 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg hover:shadow-black/5 focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="h-1 w-10 rounded-full bg-brand-yellow" />

                  <span
                    aria-hidden="true"
                    className="text-lg text-brand-muted transition group-hover:translate-x-1 group-hover:text-brand-black"
                  >
                    →
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-brand-black">
                  {area.name}
                </h3>

                <p className="mt-3 text-sm leading-6 text-brand-muted">
                  {area.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-brand-black py-20 text-white lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-yellow">
              How It Works
            </p>

            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              From search to a useful profile
            </h2>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <article>
              <div className="text-sm font-extrabold text-brand-yellow">01</div>
              <h3 className="mt-4 text-xl font-bold">Choose a starting point</h3>
              <p className="mt-3 leading-7 text-neutral-400">
                Start with an area of practice, a preferred location, or both.
              </p>
            </article>

            <article>
              <div className="text-sm font-extrabold text-brand-yellow">02</div>
              <h3 className="mt-4 text-xl font-bold">Add your preferences</h3>
              <p className="mt-3 leading-7 text-neutral-400">
                Refine the results by language, consultation method or minimum
                experience when useful.
              </p>
            </article>

            <article>
              <div className="text-sm font-extrabold text-brand-yellow">03</div>
              <h3 className="mt-4 text-xl font-bold">Review profiles</h3>
              <p className="mt-3 leading-7 text-neutral-400">
                Compare relevant public profile information and decide who you
                want to contact.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-white py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
              About FindMyLawyer
            </p>

            <h2 className="mt-4 max-w-lg text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
              A clearer starting point for finding legal help
            </h2>
          </div>

          <div className="space-y-5 text-base leading-8 text-brand-muted sm:text-lg">
            <p>
              FindMyLawyer is a Sri Lankan lawyer-discovery prototype designed
              to make the first step of searching for legal assistance easier.
            </p>

            <p>
              The platform supports lawyer discovery and routing. It does not
              replace professional legal advice.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-brand-background py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-brand-yellow px-7 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-brand-black">
                Ready to search?
              </h2>

              <p className="mt-3 leading-7 text-black/70">
                Choose a legal area and explore relevant lawyer profiles.
              </p>
            </div>

            <Link
              to="/find-lawyers"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-black px-6 font-bold text-white transition hover:bg-brand-dark lg:mt-0"
            >
              Find Lawyers
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
