function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M8 7h11M8 12h11M8 17h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function SearchResultsViewToggle({ value, onChange }) {
  return (
    <div
      className="inline-flex rounded-lg border border-brand-border bg-brand-background p-1"
      role="group"
      aria-label="Search result layout"
    >
      <ToggleButton
        active={value === "list"}
        label="List view"
        onClick={() => onChange("list")}
      >
        <ListIcon />
      </ToggleButton>
      <ToggleButton
        active={value === "grid"}
        label="Grid view"
        onClick={() => onChange("grid")}
      >
        <GridIcon />
      </ToggleButton>
    </div>
  );
}

function ToggleButton({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-8 w-9 items-center justify-center rounded-md transition ${
        active
          ? "bg-white text-brand-black shadow-sm"
          : "text-brand-muted hover:text-brand-black"
      }`}
    >
      {children}
    </button>
  );
}
