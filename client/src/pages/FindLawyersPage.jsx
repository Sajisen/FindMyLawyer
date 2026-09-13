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

import LawyerCard from "../features/lawyers/components/LawyerCard.jsx";

import {
  searchLawyers,
} from "../features/lawyers/lawyerApi.js";

export default function FindLawyersPage() {
  const [searchParams] =
    useSearchParams();

  const [
    searchMode,
    setSearchMode,
  ] = useState("manual");

  const [
    filters,
    setFilters,
  ] = useState({
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

  const [
    lawyers,
    setLawyers,
  ] = useState([]);

  const [
    resultCount,
    setResultCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    hasSearched,
    setHasSearched,
  ] = useState(false);

  /*
    Allows Home page practice-area cards
    to preselect a category.

    Example:
    /find-lawyers?category=property
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

async function handleManualSearch() {
  try {
    setLoading(true);
    setError("");
    setHasSearched(true);

    const data =
      await searchLawyers(filters);

    setLawyers(
      data.lawyers || []
    );

    setResultCount(
      data.count || 0
    );
  } catch (err) {
    setLawyers([]);
    setResultCount(0);

    setError(
      err.message ||
        "Something went wrong while searching."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-brand-background">
      {/* PAGE HEADER */}
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-9 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#806600]">
            Lawyer Search
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
            Find a Lawyer
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-brand-muted">
            Search by area of practice,
            location and preferences, or use
            Advanced Search when you are
            unsure where to start.
          </p>
        </div>
      </section>

      {/* MAIN WORKSPACE */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* LEFT SEARCH PANEL */}
          <aside className="lg:self-start">
            <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <SearchModeTabs
                mode={searchMode}
                onChange={setSearchMode}
              />

              {searchMode ===
              "manual" ? (
                <ManualSearchPanel
                  filters={filters}
                  setFilters={
                    setFilters
                  }
                  onSearch={
                    handleManualSearch
                  }
                  loading={loading}
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

          {/* RESULTS */}
          <section className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-brand-border bg-white">
              {/* Result heading */}
              <div className="border-b border-brand-border px-5 py-5 sm:px-6">
                <h2 className="text-lg font-bold text-brand-black">
                  Search Results
                </h2>

                <p className="mt-1 text-sm text-brand-muted">
                  {!hasSearched
                    ? "Matching lawyer profiles will appear here."
                    : loading
                      ? "Searching for matching profiles..."
                      : `${resultCount} matching ${
                          resultCount === 1
                            ? "profile"
                            : "profiles"
                        }`}
                </p>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex min-h-[460px] items-center justify-center px-6">
                  <div className="text-center">
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-brand-border border-t-brand-yellow-dark" />

                    <p className="mt-4 text-sm text-brand-muted">
                      Finding matching lawyers...
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {!loading &&
                error && (
                  <div className="p-5 sm:p-6">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-800">
                        We couldn&apos;t complete
                        your search
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-700">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

              {/* Before first search */}
              {!loading &&
                !error &&
                !hasSearched && (
                  <div className="flex min-h-[480px] items-center justify-center px-6 py-12">
                    <div className="max-w-sm text-center">
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
                        Find lawyers that
                        match your needs
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-brand-muted">
                        Choose an area of
                        practice and any
                        preferences on the
                        left to begin.
                      </p>
                    </div>
                  </div>
                )}

              {/* No results */}
              {!loading &&
                !error &&
                hasSearched &&
                lawyers.length === 0 && (
                  <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
                    <div className="max-w-sm text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow-soft text-xl">
                        !
                      </div>

                      <h3 className="mt-5 text-xl font-bold text-brand-black">
                        No matching profiles
                        found
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-brand-muted">
                        Try another location
                        or remove one of the
                        additional filters.
                      </p>
                    </div>
                  </div>
                )}

              {/* Lawyer results */}
              {!loading &&
                !error &&
                lawyers.length > 0 && (
                  <div className="space-y-4 bg-brand-background/60 p-4 sm:p-6">
                    {lawyers.map(
                      (lawyer) => (
                        <LawyerCard
                          key={lawyer._id}
                          lawyer={lawyer}
                        />
                      )
                    )}
                  </div>
                )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}