import { useState } from "react";

import ChevronDownIcon from "../../../components/ui/ChevronDownIcon.jsx";
import SelectControl from "../../../components/ui/SelectControl.jsx";
import LocationAutocomplete from "./LocationAutocomplete.jsx";

import {
  consultationModes,
  experienceOptions,
  languages,
} from "../data/searchOptions.js";

const EMPTY_FILTERS = {
  category: "",
  location: "",
  locationId: "",
  language: "",
  consultationMode: "",
  minExperience: "",
  acceptingNewClients: false,
};

export default function ManualSearchPanel({
  filters,
  setFilters,
  categories,
  onSearch,
  onClear,
  onFiltersChanged,
  loading,
  hasPendingChanges = false,
  notice = "",
}) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const hasMainFilter = Boolean(filters.category || filters.locationId);
  const hasUnselectedLocation = Boolean(
    filters.location.trim() && !filters.locationId
  );
  const canSearch = hasMainFilter && !hasUnselectedLocation;

  function markChanged() {
    onFiltersChanged?.();
  }

  function updateFilter(field, value) {
    if (field === "category" && !value && !filters.locationId) {
      setShowMoreFilters(false);
    }

    markChanged();
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleLocationChange(value) {
    if (!filters.category) {
      setShowMoreFilters(false);
    }

    markChanged();
    setFilters((previous) => ({
      ...previous,
      location: value,
      locationId: "",
    }));
  }

  function handleLocationSelect(location) {
    if (!location) {
      return;
    }

    markChanged();
    setFilters((previous) => ({
      ...previous,
      location: location.city,
      locationId: location.id,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!canSearch) {
      return;
    }

    onSearch();
  }

  function clearFilters() {
    setShowMoreFilters(false);

    if (onClear) {
      onClear();
      return;
    }

    markChanged();
    setFilters(EMPTY_FILTERS);
  }

  const advancedFiltersOpen = hasMainFilter && showMoreFilters;

  const extraFilterCount = [
    filters.language,
    filters.consultationMode,
    filters.minExperience,
    filters.acceptingNewClients,
  ].filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div>
        <label
          htmlFor="practice-area"
          className="mb-2 block text-sm font-semibold text-brand-black"
        >
          Area of Practice
        </label>

        <SelectControl
          id="practice-area"
          value={filters.category}
          onChange={(event) => updateFilter("category", event.target.value)}
        >
          <option value="">Any area of practice</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectControl>
      </div>

      <div className="mt-5">
        <label
          htmlFor="location"
          className="mb-2 block text-sm font-semibold text-brand-black"
        >
          Preferred Location
          <span className="ml-1 font-normal text-brand-muted">(optional)</span>
        </label>

        <LocationAutocomplete
          id="location"
          value={filters.location}
          onChange={handleLocationChange}
          onSelect={handleLocationSelect}
          placeholder="Start typing a city"
        />

        {hasUnselectedLocation ? (
          <p className="mt-2 text-xs leading-5 text-amber-700">
            Select a location from the suggestions to use it.
          </p>
        ) : (
          <p className="mt-2 text-xs leading-5 text-brand-muted">
            Exact city matches appear first, followed by the same district and
            province.
          </p>
        )}
      </div>

      {!hasMainFilter && (
        <p className="mt-4 text-xs leading-5 text-brand-muted">
          Choose an area of practice or a location to start.
        </p>
      )}

      <button
        type="button"
        disabled={!hasMainFilter}
        onClick={() => setShowMoreFilters((previous) => !previous)}
        aria-expanded={advancedFiltersOpen}
        className="mt-5 flex w-full items-center justify-between border-y border-brand-border py-4 text-sm font-semibold text-brand-black transition hover:text-brand-black disabled:cursor-not-allowed disabled:text-neutral-400"
      >
        <span className="flex items-center gap-2">
          More Filters
          {extraFilterCount > 0 && (
            <span className="rounded-full bg-brand-yellow-soft px-2 py-0.5 text-xs font-bold text-[#705900]">
              {extraFilterCount}
            </span>
          )}
        </span>

        <ChevronDownIcon
          className={`h-4 w-4 text-brand-muted transition-transform ${
            advancedFiltersOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {advancedFiltersOpen && (
        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="language"
              className="mb-2 block text-sm font-semibold text-brand-black"
            >
              Language
            </label>

            <SelectControl
              id="language"
              disabled={!hasMainFilter}
              value={filters.language}
              onChange={(event) => updateFilter("language", event.target.value)}
            >
              <option value="">Any language</option>

              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </SelectControl>
          </div>

          <div>
            <label
              htmlFor="consultation-mode"
              className="mb-2 block text-sm font-semibold text-brand-black"
            >
              Consultation
            </label>

            <SelectControl
              id="consultation-mode"
              disabled={!hasMainFilter}
              value={filters.consultationMode}
              onChange={(event) =>
                updateFilter("consultationMode", event.target.value)
              }
            >
              <option value="">Any consultation method</option>

              {consultationModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </SelectControl>
          </div>

          <div>
            <label
              htmlFor="experience"
              className="mb-2 block text-sm font-semibold text-brand-black"
            >
              Experience
            </label>

            <SelectControl
              id="experience"
              disabled={!hasMainFilter}
              value={filters.minExperience}
              onChange={(event) =>
                updateFilter("minExperience", event.target.value)
              }
            >
              {experienceOptions.map((option) => (
                <option key={option.value || "any"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectControl>
          </div>

          <label
            className={`flex items-start gap-3 rounded-xl border border-brand-border p-4 ${
              hasMainFilter
                ? "cursor-pointer bg-brand-background"
                : "cursor-not-allowed bg-neutral-100 opacity-60"
            }`}
          >
            <input
              type="checkbox"
              disabled={!hasMainFilter}
              checked={filters.acceptingNewClients}
              onChange={(event) =>
                updateFilter("acceptingNewClients", event.target.checked)
              }
              className="mt-0.5 h-4 w-4 accent-brand-yellow-dark"
            />

            <span>
              <span className="block text-sm font-semibold text-brand-black">
                Accepting new clients
              </span>
              <span className="mt-1 block text-xs leading-5 text-brand-muted">
                Show only profiles currently accepting new clients.
              </span>
            </span>
          </label>
        </div>
      )}

      {hasPendingChanges && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium leading-5 text-amber-800"
        >
          Filters changed. Search again to update the results.
        </div>
      )}

      {!hasPendingChanges && notice && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-yellow-200 bg-brand-yellow-soft px-3 py-2.5 text-xs font-medium leading-5 text-[#705900]"
        >
          {notice}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !canSearch}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-brand-yellow px-5 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Finding Lawyers..."
          : hasPendingChanges
            ? "Update Results"
            : "Find Lawyers"}
      </button>

      <button
        type="button"
        onClick={clearFilters}
        disabled={loading}
        className="mt-3 flex h-10 w-full items-center justify-center text-sm font-semibold text-brand-muted transition hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Clear filters
      </button>
    </form>
  );
}
