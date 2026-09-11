import { useState } from "react";

import {
  consultationModes,
  experienceOptions,
  languages,
  legalCategories,
  locationSuggestions,
} from "../data/searchOptions.js";

export default function ManualSearchPanel({
  filters,
  setFilters,
}) {
  const [showMoreFilters, setShowMoreFilters] =
    useState(false);

  function updateFilter(field, value) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Backend search will be connected next.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6"
    >
      <div>
        <label
          htmlFor="practice-area"
          className="mb-2 block text-sm font-semibold text-brand-black"
        >
          Area of Practice
        </label>

        <select
          id="practice-area"
          value={filters.category}
          onChange={(event) =>
            updateFilter(
              "category",
              event.target.value
            )
          }
          className="h-12 w-full rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-black outline-none transition focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
        >
          <option value="">
            Select an area of practice
          </option>

          {legalCategories.map((category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label
          htmlFor="location"
          className="mb-2 block text-sm font-semibold text-brand-black"
        >
          Preferred Location
        </label>

        <input
          id="location"
          type="text"
          list="manual-location-options"
          value={filters.location}
          onChange={(event) =>
            updateFilter(
              "location",
              event.target.value
            )
          }
          placeholder="e.g. Panadura"
          className="h-12 w-full rounded-xl border border-brand-border bg-white px-4 text-sm text-brand-black outline-none transition placeholder:text-neutral-400 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
        />

        <datalist id="manual-location-options">
          {locationSuggestions.map((location) => (
            <option
              key={location}
              value={location}
            />
          ))}
        </datalist>
      </div>

      <button
        type="button"
        onClick={() =>
          setShowMoreFilters((previous) => !previous)
        }
        className="mt-5 flex w-full items-center justify-between border-y border-brand-border py-4 text-sm font-semibold text-brand-black"
      >
        <span>
          More Filters
        </span>

        <span
          className={`text-brand-muted transition-transform ${
            showMoreFilters
              ? "rotate-180"
              : ""
          }`}
        >
          ▾
        </span>
      </button>

      {showMoreFilters && (
        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="language"
              className="mb-2 block text-sm font-semibold text-brand-black"
            >
              Language
            </label>

            <select
              id="language"
              value={filters.language}
              onChange={(event) =>
                updateFilter(
                  "language",
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
            >
              <option value="">
                Any language
              </option>

              {languages.map((language) => (
                <option
                  key={language}
                  value={language}
                >
                  {language}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="consultation-mode"
              className="mb-2 block text-sm font-semibold text-brand-black"
            >
              Consultation
            </label>

            <select
              id="consultation-mode"
              value={filters.consultationMode}
              onChange={(event) =>
                updateFilter(
                  "consultationMode",
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
            >
              <option value="">
                Any consultation method
              </option>

              {consultationModes.map((mode) => (
                <option
                  key={mode}
                  value={mode}
                >
                  {mode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="experience"
              className="mb-2 block text-sm font-semibold text-brand-black"
            >
              Experience
            </label>

            <select
              id="experience"
              value={filters.minExperience}
              onChange={(event) =>
                updateFilter(
                  "minExperience",
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
            >
              {experienceOptions.map((option) => (
                <option
                  key={
                    option.value ||
                    "any"
                  }
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-brand-yellow px-5 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark"
      >
        Find Lawyers
      </button>
    </form>
  );
}