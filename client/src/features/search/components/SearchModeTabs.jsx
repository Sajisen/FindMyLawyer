export default function SearchModeTabs({
  mode,
  onChange,
}) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-brand-background p-1">
      <button
        type="button"
        onClick={() => onChange("manual")}
        className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
          mode === "manual"
            ? "bg-brand-black text-white shadow-sm"
            : "text-brand-muted hover:text-brand-black"
        }`}
      >
        Manual Search
      </button>

      <button
        type="button"
        onClick={() => onChange("advanced")}
        className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
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