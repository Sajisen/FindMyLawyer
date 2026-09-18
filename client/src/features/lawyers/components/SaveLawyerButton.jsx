import { useState } from "react";

import { useSavedLawyers } from "../../../context/useSavedLawyers.js";

export default function SaveLawyerButton({
  lawyer,
  compact = false,
  iconOnly = false,
}) {
  const { canSave, isSaved, isBusy, loading, toggleSaved } = useSavedLawyers();
  const [failureMessage, setFailureMessage] = useState("");

  if (!canSave || !lawyer?._id) {
    return null;
  }

  const saved = isSaved(lawyer._id);
  const busy = loading || isBusy(lawyer._id);

  async function handleClick() {
    setFailureMessage("");

    try {
      await toggleSaved(lawyer);
    } catch (error) {
      setFailureMessage(error.message || "Unable to update saved lawyers.");
    }
  }

  const label = loading ? "Loading..." : busy ? "Saving..." : saved ? "Saved" : "Save";
  const accessibleLabel = saved
    ? "Remove from saved lawyers"
    : "Save lawyer";

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={saved}
        aria-label={accessibleLabel}
        title={iconOnly ? accessibleLabel : undefined}
        className={`inline-flex items-center justify-center gap-2 border font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
          iconOnly
            ? "h-10 w-10 rounded-full"
            : compact
              ? "rounded-lg px-3 py-2 text-sm"
              : "rounded-xl px-4 py-2.5 text-sm"
        } ${
          failureMessage
            ? "border-red-200 bg-red-50 text-red-700"
            : saved
              ? "border-brand-yellow bg-brand-yellow-soft text-brand-black"
              : "border-brand-border bg-white text-brand-muted hover:border-neutral-300 hover:bg-brand-background hover:text-brand-black"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M12 20.2 4.9 13.6A4.8 4.8 0 0 1 11.7 6.8L12 7l.3-.2a4.8 4.8 0 0 1 6.8 6.8L12 20.2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        {!iconOnly && label}
      </button>

      {failureMessage && !iconOnly && (
        <span className="max-w-48 text-xs leading-4 text-red-700" role="status">
          {failureMessage}
        </span>
      )}
    </span>
  );
}
