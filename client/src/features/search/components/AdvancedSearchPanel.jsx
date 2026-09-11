import {
  locationSuggestions,
} from "../data/searchOptions.js";

export default function AdvancedSearchPanel({
  advancedSearch,
  setAdvancedSearch,
}) {
  function updateField(field, value) {
    setAdvancedSearch((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    // DeepSeek classification will be
    // connected later.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6"
    >
      <div>
        <label
          htmlFor="legal-description"
          className="block text-sm font-semibold text-brand-black"
        >
          Describe your situation
        </label>

        <p className="mt-1 text-xs leading-5 text-brand-muted">
          Write naturally in English or Sinhala.
        </p>

        <textarea
          id="legal-description"
          rows="7"
          maxLength="1200"
          value={advancedSearch.description}
          onChange={(event) =>
            updateField(
              "description",
              event.target.value
            )
          }
          placeholder="Briefly describe what happened and the type of help you are looking for..."
          className="mt-3 w-full resize-none rounded-xl border border-brand-border bg-white p-4 text-sm leading-6 text-brand-black outline-none transition placeholder:text-neutral-400 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
        />

        <div className="mt-1 text-right text-xs text-brand-muted">
          {
            advancedSearch.description
              .length
          }
          /1200
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="advanced-location"
          className="mb-2 block text-sm font-semibold text-brand-black"
        >
          Preferred Location
        </label>

        <input
          id="advanced-location"
          type="text"
          list="advanced-location-options"
          value={advancedSearch.location}
          onChange={(event) =>
            updateField(
              "location",
              event.target.value
            )
          }
          placeholder="e.g. Panadura"
          className="h-12 w-full rounded-xl border border-brand-border bg-white px-4 text-sm text-brand-black outline-none transition placeholder:text-neutral-400 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
        />

        <datalist id="advanced-location-options">
          {locationSuggestions.map((location) => (
            <option
              key={location}
              value={location}
            />
          ))}
        </datalist>
      </div>

      <div className="mt-5 rounded-xl border border-yellow-200 bg-brand-yellow-soft p-4">
        <p className="text-xs leading-5 text-brand-muted">
          Avoid including NIC numbers, bank details,
          passwords, telephone numbers or exact home
          addresses.
        </p>
      </div>

      <button
        type="submit"
        disabled={
          !advancedSearch.description.trim()
        }
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-brand-yellow px-5 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Analyze Situation
      </button>

      <p className="mt-3 text-center text-xs leading-5 text-brand-muted">
        You&apos;ll review the suggested categories
        before they are applied to your search.
      </p>
    </form>
  );
}