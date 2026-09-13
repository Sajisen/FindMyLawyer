import { useState } from "react";

import { analyzeLegalSituation } from "../advancedSearchApi.js";

const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_DESCRIPTION_LENGTH = 20;

function getStatusCopy(status) {
  if (status === "irrelevant") {
    return {
      title: "This does not look like a legal situation",
      body: "Describe the legal problem or dispute you want help finding a lawyer for.",
    };
  }

  return {
    title: "We need a clearer description",
    body: "Check what you entered and describe the main problem in a little more detail.",
  };
}

export default function AdvancedSearchPanel({
  advancedSearch,
  setAdvancedSearch,
  onApplySuggestion,
}) {
  const [analysis, setAnalysis] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateDescription(value) {
    setAdvancedSearch((previous) => ({
      ...previous,
      description: value,
    }));

    setAnalysis(null);
    setSelectedCategoryId("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const description = advancedSearch.description.trim();

    if (description.length < MIN_DESCRIPTION_LENGTH) {
      setError("Please describe the situation in a little more detail.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnalysis(null);

      const data = await analyzeLegalSituation(description);
      const nextAnalysis = data.analysis;

      setAnalysis(nextAnalysis);
      setSelectedCategoryId(
        nextAnalysis?.status === "valid"
          ? nextAnalysis.primaryCategory?.id || ""
          : ""
      );
    } catch (requestError) {
      setError(
        requestError.message || "Unable to analyze the situation right now."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (
      !analysis ||
      analysis.status !== "valid" ||
      !selectedCategoryId
    ) {
      return;
    }

    onApplySuggestion({
      category: selectedCategoryId,
      location: analysis.suggestedLocation?.city || "",
      locationId: analysis.suggestedLocation?.id || "",
    });
  }

  const categoryOptions =
    analysis?.status === "valid"
      ? [analysis.primaryCategory, ...(analysis.alternativeCategories || [])]
          .filter(Boolean)
      : [];

  const statusCopy = analysis ? getStatusCopy(analysis.status) : null;

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="rounded-xl border border-yellow-200 bg-brand-yellow-soft p-4">
        <p className="text-sm font-semibold text-brand-black">
          Not sure which legal area fits?
        </p>
        <p className="mt-1 text-xs leading-5 text-brand-muted">
          Describe what happened. Advanced Search suggests a search category,
          not legal advice.
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="legal-description"
          className="block text-sm font-semibold text-brand-black"
        >
          Describe your situation
        </label>

        <p className="mt-1 text-xs leading-5 text-brand-muted">
          Use plain language and leave out names, ID numbers and other details
          that are not needed.
        </p>

        <textarea
          id="legal-description"
          rows="9"
          maxLength={MAX_DESCRIPTION_LENGTH}
          value={advancedSearch.description}
          onChange={(event) => updateDescription(event.target.value)}
          placeholder="For example: My phone was stolen in Colombo and I want to find a lawyer who handles this type of matter."
          className="mt-3 w-full resize-y rounded-xl border border-brand-border bg-white p-4 text-sm leading-6 text-brand-black outline-none transition placeholder:text-neutral-400 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
        />

        <div className="mt-1 flex items-center justify-between gap-3 text-xs text-brand-muted">
          <span>Minimum {MIN_DESCRIPTION_LENGTH} characters</span>
          <span>
            {advancedSearch.description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          advancedSearch.description.trim().length < MIN_DESCRIPTION_LENGTH
        }
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-brand-yellow px-5 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Situation"}
      </button>

      {analysis?.status === "valid" && (
        <div className="mt-6 rounded-2xl border border-brand-border bg-brand-background p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#806600]">
            Suggested search
          </p>

          <div className="mt-4 space-y-2">
            {categoryOptions.map((category, index) => (
              <label
                key={category.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  selectedCategoryId === category.id
                    ? "border-brand-yellow-dark bg-white ring-1 ring-brand-yellow/30"
                    : "border-brand-border bg-white hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="suggested-category"
                  value={category.id}
                  checked={selectedCategoryId === category.id}
                  onChange={() => setSelectedCategoryId(category.id)}
                  className="mt-1 h-4 w-4 accent-brand-yellow-dark"
                />

                <span>
                  <span className="block text-sm font-semibold text-brand-black">
                    {category.name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-brand-muted">
                    {index === 0
                      ? "Best matching category"
                      : "Possible alternative"}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {analysis.reason && (
            <details className="mt-4 rounded-xl border border-brand-border bg-white px-3 py-2.5">
              <summary className="cursor-pointer text-sm font-semibold text-brand-black outline-none">
                Why this suggestion?
              </summary>
              <p className="mt-2 text-xs leading-5 text-brand-muted">
                {analysis.reason}
              </p>
            </details>
          )}

          {analysis.suggestedLocation && (
            <div className="mt-4 rounded-xl border border-brand-border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Location found
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-black">
                {analysis.suggestedLocation.city}
              </p>
              <p className="mt-1 text-xs leading-5 text-brand-muted">
                It will be used as a preferred location and can be changed.
              </p>
            </div>
          )}

          {analysis.locationAmbiguous && (
            <p className="mt-4 text-xs leading-5 text-brand-muted">
              More than one configured city was mentioned, so no location was
              selected automatically.
            </p>
          )}

          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedCategoryId}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-brand-yellow px-4 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply and Search
          </button>
        </div>
      )}

      {analysis && analysis.status !== "valid" && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            {statusCopy.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            {statusCopy.body}
          </p>

          {analysis.reason && (
            <p className="mt-3 border-t border-amber-200 pt-3 text-xs leading-5 text-amber-800">
              {analysis.reason}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
