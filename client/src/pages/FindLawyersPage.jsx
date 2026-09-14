import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import SearchModeTabs from "../features/search/components/SearchModeTabs.jsx";
import ManualSearchPanel from "../features/search/components/ManualSearchPanel.jsx";
import AdvancedSearchPanel from "../features/search/components/AdvancedSearchPanel.jsx";
import LawyerCard from "../features/lawyers/components/LawyerCard.jsx";
import Pagination from "../features/lawyers/components/Pagination.jsx";
import SearchResultsViewToggle from "../features/lawyers/components/SearchResultsViewToggle.jsx";
import { searchLawyers } from "../features/lawyers/lawyerApi.js";
import useLegalCategories from "../features/search/hooks/useLegalCategories.js";
import {
  clearSearchReturnState,
  readSearchReturnState,
  rememberSearchReturnState,
} from "../features/search/utils/searchReturnState.js";

const RESULTS_PER_PAGE = 10;
const VIEW_STORAGE_KEY = "findmylawyer.searchResultsView.v1";

const EMPTY_FILTERS = {
  category: "",
  location: "",
  locationId: "",
  language: "",
  consultationMode: "",
  minExperience: "",
  acceptingNewClients: false,
};

const EMPTY_PAGINATION = {
  page: 1,
  limit: RESULTS_PER_PAGE,
  totalPages: 1,
  totalResults: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

function getInitialViewMode() {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

function copyFilters(filters) {
  return {
    category: filters.category || "",
    location: filters.location || "",
    locationId: filters.locationId || "",
    language: filters.language || "",
    consultationMode: filters.consultationMode || "",
    minExperience: filters.minExperience || "",
    acceptingNewClients: Boolean(filters.acceptingNewClients),
  };
}

function filtersAreEqual(left, right) {
  if (!left || !right) {
    return false;
  }

  return (
    left.category === right.category &&
    left.location.trim() === right.location.trim() &&
    left.locationId === right.locationId &&
    left.language === right.language &&
    left.consultationMode === right.consultationMode &&
    left.minExperience === right.minExperience &&
    Boolean(left.acceptingNewClients) === Boolean(right.acceptingNewClients)
  );
}

function getFiltersFromParams(params) {
  return {
    category: params.get("category") || "",
    location: params.get("location") || "",
    locationId: params.get("locationId") || "",
    language: params.get("language") || "",
    consultationMode: params.get("consultationMode") || "",
    minExperience: params.get("minExperience") || "",
    acceptingNewClients: params.get("acceptingNewClients") === "true",
  };
}

function getPageFromParams(params) {
  const page = Number(params.get("page") || "1");
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getSearchParamsFromFilters(filters, page = 1) {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.location.trim()) {
    params.set("location", filters.location.trim());
  }

  if (filters.locationId) {
    params.set("locationId", filters.locationId);
  }

  if (filters.language) {
    params.set("language", filters.language);
  }

  if (filters.consultationMode) {
    params.set("consultationMode", filters.consultationMode);
  }

  if (filters.minExperience) {
    params.set("minExperience", filters.minExperience);
  }

  if (filters.acceptingNewClients) {
    params.set("acceptingNewClients", "true");
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  params.set("search", "1");

  return params;
}

export default function FindLawyersPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const currentPath = `${location.pathname}${location.search}`;
  const { categories } = useLegalCategories();

  const [searchMode, setSearchMode] = useState("manual");
  const [viewMode, setViewMode] = useState(getInitialViewMode);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [manualNotice, setManualNotice] = useState("");
  const [advancedSearch, setAdvancedSearch] = useState({
    description: "",
  });

  const [lawyers, setLawyers] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [searchMeta, setSearchMeta] = useState({});
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const lastAutoSearchKeyRef = useRef("");
  const restoredUiRef = useRef(false);
  const restoredScrollRef = useRef(false);
  const returnStateRef = useRef(undefined);

  if (returnStateRef.current === undefined) {
    returnStateRef.current = readSearchReturnState(currentPath);
  }

  const runManualSearch = useCallback(async (searchFilters, page = 1) => {
    const snapshot = copyFilters(searchFilters);

    try {
      setAppliedFilters(snapshot);
      setLoading(true);
      setError("");
      setHasSearched(true);

      const data = await searchLawyers(snapshot, {
        page,
        limit: RESULTS_PER_PAGE,
      });

      setLawyers(data.lawyers || []);
      setResultCount(data.count || 0);
      setSearchMeta(data.searchMeta || {});
      setPagination(data.pagination || EMPTY_PAGINATION);
    } catch (searchError) {
      setLawyers([]);
      setResultCount(0);
      setSearchMeta({});
      setPagination(EMPTY_PAGINATION);
      setError(searchError.message || "Something went wrong while searching.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(paramsKey);
    const nextFilters = getFiltersFromParams(params);
    const nextPage = getPageFromParams(params);
    const hasMainFilter = Boolean(
      nextFilters.category || nextFilters.locationId || nextFilters.location
    );
    const returnState = returnStateRef.current;

    if (returnState && !restoredUiRef.current) {
      restoredUiRef.current = true;
      setFilters(returnState.filters ? copyFilters(returnState.filters) : nextFilters);
      setSearchMode(returnState.searchMode || "manual");
      setManualNotice(returnState.manualNotice || "");
      if (returnState.viewMode === "grid" || returnState.viewMode === "list") {
        setViewMode(returnState.viewMode);
      }
      if (returnState.advancedSearch?.description !== undefined) {
        setAdvancedSearch({
          description: String(returnState.advancedSearch.description || ""),
        });
      }
    } else {
      setFilters(nextFilters);
      setSearchMode("manual");
    }

    if (
      params.get("search") === "1" &&
      hasMainFilter &&
      lastAutoSearchKeyRef.current !== paramsKey
    ) {
      lastAutoSearchKeyRef.current = paramsKey;
      runManualSearch(nextFilters, nextPage);
    }
  }, [paramsKey, runManualSearch]);

  useEffect(() => {
    const returnState = returnStateRef.current;

    const waitingForPreviousResults =
      Boolean(returnState?.hadSearch) && (!hasSearched || loading);

    if (
      !returnState ||
      restoredScrollRef.current ||
      waitingForPreviousResults ||
      (!returnState.hadSearch && loading)
    ) {
      return undefined;
    }

    restoredScrollRef.current = true;
    let secondFrame = null;

    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo({
          top: Math.max(0, Number(returnState.scrollY) || 0),
          left: 0,
          behavior: "auto",
        });
        clearSearchReturnState();
        returnStateRef.current = null;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [error, hasSearched, lawyers.length, loading, resultCount]);

  function submitFilters(nextFilters, page = 1) {
    const nextParams = getSearchParamsFromFilters(nextFilters, page);
    const nextKey = nextParams.toString();

    if (nextKey === paramsKey) {
      runManualSearch(nextFilters, page);
      return;
    }

    setSearchParams(nextParams);
  }

  function handleManualSearch() {
    const hasMainFilter = Boolean(filters.category || filters.locationId);
    const hasUnselectedLocation = Boolean(
      filters.location.trim() && !filters.locationId
    );

    if (!hasMainFilter || hasUnselectedLocation) {
      return;
    }

    setManualNotice("");
    submitFilters(filters, 1);
  }

  function handlePageChange(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === pagination.page
    ) {
      return;
    }

    submitFilters(appliedFilters || filters, nextPage);
  }

  function handleClearSearch() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(null);
    setManualNotice("");
    setLawyers([]);
    setResultCount(0);
    setSearchMeta({});
    setPagination(EMPTY_PAGINATION);
    setError("");
    setHasSearched(false);
    lastAutoSearchKeyRef.current = "";
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  function handleApplyAdvancedSuggestion(suggestion) {
    const nextFilters = {
      ...EMPTY_FILTERS,
      category: suggestion.category,
      location: suggestion.location || "",
      locationId: suggestion.locationId || "",
    };

    setFilters(nextFilters);
    setSearchMode("manual");
    setManualNotice(
      "Suggested category applied. Add filters if you want to narrow the results."
    );
    submitFilters(nextFilters, 1);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    });
  }

  function handleViewModeChange(nextMode) {
    if (nextMode !== "list" && nextMode !== "grid") {
      return;
    }

    setViewMode(nextMode);

    try {
      localStorage.setItem(VIEW_STORAGE_KEY, nextMode);
    } catch {
      // The selected view still works for the current session if storage is unavailable.
    }
  }

  function handleOpenProfile() {
    rememberSearchReturnState({
      path: currentPath,
      scrollY: window.scrollY,
      filters: copyFilters(filters),
      appliedFilters: appliedFilters ? copyFilters(appliedFilters) : null,
      searchMode,
      manualNotice,
      viewMode,
      advancedSearch,
      hadSearch: hasSearched,
    });
  }

  const hasPendingChanges =
    hasSearched &&
    appliedFilters !== null &&
    !filtersAreEqual(filters, appliedFilters);

  const firstResult =
    resultCount > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const lastResult =
    resultCount > 0
      ? Math.min(pagination.page * pagination.limit, resultCount)
      : 0;

  return (
    <main className="min-h-screen bg-brand-background">
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
            Find lawyers
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted sm:text-base">
            Use filters to search directly, or Advanced Search if you are not
            sure which legal area fits.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="lg:self-start">
            <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <SearchModeTabs mode={searchMode} onChange={setSearchMode} />

              {searchMode === "manual" ? (
                <ManualSearchPanel
                  filters={filters}
                  setFilters={setFilters}
                  categories={categories}
                  onSearch={handleManualSearch}
                  onClear={handleClearSearch}
                  onFiltersChanged={() => setManualNotice("")}
                  loading={loading}
                  hasPendingChanges={hasPendingChanges}
                  notice={manualNotice}
                />
              ) : (
                <AdvancedSearchPanel
                  advancedSearch={advancedSearch}
                  setAdvancedSearch={setAdvancedSearch}
                  onApplySuggestion={handleApplyAdvancedSuggestion}
                />
              )}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-brand-border bg-white">
              <div className="border-b border-brand-border px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-brand-black">
                      Search Results
                    </h2>

                    {hasSearched && !loading && !error && resultCount > 0 && (
                      <div className="mt-1 text-sm font-medium text-brand-muted">
                        <p>
                          Showing {firstResult} to {lastResult} of {resultCount}{" "}
                          matching {resultCount === 1 ? "profile" : "profiles"}
                        </p>

                        {searchMeta.locationFound && (
                          <p className="mt-1 text-xs font-normal">
                            {searchMeta.locationRelevantCount} nearby
                            {searchMeta.onlineFallbackCount > 0
                              ? ` · ${searchMeta.onlineFallbackCount} online ${
                                  searchMeta.onlineFallbackCount === 1
                                    ? "alternative"
                                    : "alternatives"
                                }`
                              : " · ranked by city, district and province"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {!loading && !error && lawyers.length > 0 && (
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <span className="hidden text-xs font-semibold text-brand-muted sm:inline">
                        View
                      </span>
                      <SearchResultsViewToggle
                        value={viewMode}
                        onChange={handleViewModeChange}
                      />
                    </div>
                  )}
                </div>
              </div>

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

              {!loading && error && (
                <div className="p-5 sm:p-6">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-800">
                      We couldn&apos;t complete your search
                    </p>
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && !hasSearched && (
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
                      Start with a legal area or location
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-brand-muted">
                      Select one main filter, then add other preferences if you
                      need them.
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && hasSearched && lawyers.length === 0 && (
                <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
                  <div className="max-w-sm text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow-soft text-xl font-bold">
                      0
                    </div>

                    <h3 className="mt-5 text-xl font-bold text-brand-black">
                      No matching profiles found
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-brand-muted">
                      Try another area or location, or remove an additional
                      filter and search again.
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && lawyers.length > 0 && (
                <>
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid gap-4 bg-brand-background/60 p-4 md:grid-cols-2 sm:p-6"
                        : "space-y-4 bg-brand-background/60 p-4 sm:p-6"
                    }
                  >
                    {lawyers.map((lawyer) => (
                      <LawyerCard
                        key={lawyer._id}
                        lawyer={lawyer}
                        categories={categories}
                        variant={viewMode}
                        onOpenProfile={handleOpenProfile}
                      />
                    ))}
                  </div>

                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    disabled={loading || hasPendingChanges}
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
