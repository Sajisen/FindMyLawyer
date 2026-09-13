export default function SearchModeTabs({ mode, onChange }) {
  return (
    <div
      className="grid grid-cols-2 rounded-xl bg-brand-background p-1"
      role="tablist"
      aria-label="Search method"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "manual"}
        onClick={() => onChange("manual")}
        className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/30 ${
          mode === "manual"
            ? "bg-brand-black text-white shadow-sm"
            : "text-brand-muted hover:text-brand-black"
        }`}
      >
        Manual Search
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={mode === "advanced"}
        onClick={() => onChange("advanced")}
        className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-yellow-dark/30 ${
          mode === "advanced"
            ? "bg-brand-black text-white shadow-sm"
            : "text-brand-muted hover:text-brand-black"
        }`}
      >
        Advanced Search
      </button>
    </div>
  );
}
