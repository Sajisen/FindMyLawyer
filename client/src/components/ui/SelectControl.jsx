import ChevronDownIcon from "./ChevronDownIcon.jsx";

export default function SelectControl({
  children,
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <div className="relative">
      <select
        {...props}
        disabled={disabled}
        className={`h-12 w-full appearance-none rounded-xl border border-brand-border bg-white px-4 pr-10 text-sm text-brand-black shadow-[0_1px_0_rgba(17,17,17,0.02)] outline-none transition hover:border-neutral-300 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 ${className}`}
      >
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-muted">
        <ChevronDownIcon />
      </span>
    </div>
  );
}
