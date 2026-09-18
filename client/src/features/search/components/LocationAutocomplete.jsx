import { useEffect, useRef, useState } from "react";

import ChevronDownIcon from "../../../components/ui/ChevronDownIcon.jsx";
import { getLocationSuggestions } from "../searchMetaApi.js";

export default function LocationAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder = "e.g. Panadura",
  disabled = false,
}) {
  const [locations, setLocations] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (disabled) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getLocationSuggestions(value);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setLocations(data.locations || []);
      } catch (requestError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setLocations([]);
        setError(requestError.message || "Unable to load locations.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [disabled, value]);

  const dropdownOpen = open && !disabled;
  const isLoading = loading && !disabled;

  function chooseLocation(location) {
    onChange(location.city);
    onSelect?.(location);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          onSelect?.(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={dropdownOpen}
        aria-controls={`${id}-options`}
        className="h-12 w-full rounded-xl border border-brand-border bg-white px-4 pr-10 text-sm text-brand-black outline-none transition placeholder:text-neutral-400 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20 disabled:cursor-not-allowed disabled:bg-neutral-100"
      />

      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-muted">
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-border border-t-brand-black" />
        ) : (
          <ChevronDownIcon />
        )}
      </div>

      {dropdownOpen && (
        <div
          id={`${id}-options`}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-brand-border bg-white py-1 shadow-xl shadow-black/10"
        >
          {error ? (
            <p className="px-4 py-3 text-sm text-red-700">{error}</p>
          ) : locations.length > 0 ? (
            locations.map((location) => (
              <button
                key={
                  location.id ||
                  `${location.city}-${location.district}-${location.province}`
                }
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseLocation(location)}
                className="block w-full px-4 py-3 text-left transition hover:bg-brand-yellow-soft focus:bg-brand-yellow-soft focus:outline-none"
              >
                <span className="block text-sm font-semibold text-brand-black">
                  {location.city}
                </span>

                {(location.district || location.province) && (
                  <span className="mt-0.5 block text-xs text-brand-muted">
                    {[location.district, location.province]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </button>
            ))
          ) : loading ? (
            <p className="px-4 py-3 text-sm text-brand-muted">
              Loading locations...
            </p>
          ) : (
            <p className="px-4 py-3 text-sm text-brand-muted">
              No configured locations match this entry.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
