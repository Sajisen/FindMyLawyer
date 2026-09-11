import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import SearchModeTabs from "../features/search/components/SearchModeTabs.jsx";
import ManualSearchPanel from "../features/search/components/ManualSearchPanel.jsx";
import AdvancedSearchPanel from "../features/search/components/AdvancedSearchPanel.jsx";

export default function FindLawyersPage() {
  const [searchParams] = useSearchParams();

  const [searchMode, setSearchMode] =
    useState("manual");

  const [filters, setFilters] =
    useState({
      category: "",
      location: "",
      language: "",
      consultationMode: "",
      minExperience: "",
    });

  const [
    advancedSearch,
    setAdvancedSearch,
  ] = useState({
    description: "",
    location: "",
  });

  /*
    If the user clicks a practice-area card
    from the Home page, we can preselect it.
  */
  useEffect(() => {
    const category =
      searchParams.get("category");

    if (category) {
      setFilters((previous) => ({
        ...previous,
        category,
      }));

      setSearchMode("manual");
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-brand-background">
      {/* Page Header */}
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#806600]">
            Lawyer Search
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
            Find a Lawyer
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-brand-muted">
            Search by area of practice, location
            and preferences, or use Advanced Search
            when you&apos;re unsure where to start.
          </p>
        </div>
      </section>

      {/* Search Workspace */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* LEFT SEARCH PANEL */}
          <aside className="lg:self-start">
            <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <SearchModeTabs
                mode={searchMode}
                onChange={setSearchMode}
              />

              {searchMode === "manual" ? (
                <ManualSearchPanel
                  filters={filters}
                  setFilters={setFilters}
                />
              ) : (
                <AdvancedSearchPanel
                  advancedSearch={
                    advancedSearch
                  }
                  setAdvancedSearch={
                    setAdvancedSearch
                  }
                />
              )}
            </div>
          </aside>

          {/* RIGHT RESULTS AREA */}
          <section className="min-w-0">
            <div className="rounded-2xl border border-brand-border bg-white">
              {/* Results heading */}
              <div className="border-b border-brand-border px-6 py-5">
                <h2 className="text-lg font-bold text-brand-black">
                  Search Results
                </h2>

                <p className="mt-1 text-sm text-brand-muted">
                  Matching lawyer profiles will appear
                  here.
                </p>
              </div>

              {/* Initial Empty State */}
              <div className="flex min-h-[480px] items-center justify-center px-6 py-12">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-yellow-soft">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-8 w-8 text-brand-black"
                      aria-hidden="true"
                    >
                      <path
                        d="M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />

                      <path
                        d="m16 16 4 4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-brand-black">
                    Find lawyers that match your needs
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-brand-muted">
                    Choose your search options on the
                    left to get started. Matching
                    profiles will appear here.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}