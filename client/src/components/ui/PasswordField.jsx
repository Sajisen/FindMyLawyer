import { useState } from "react";

function EyeIcon({ hidden }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M2.8 12s3.2-5.2 9.2-5.2S21.2 12 21.2 12 18 17.2 12 17.2 2.8 12 2.8 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      {hidden && (
        <path
          d="m4.2 4.2 15.6 15.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function PasswordField({
  label,
  value,
  onChange,
  name,
  autoComplete,
  minLength,
  maxLength = 128,
  required = true,
  hint,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm font-semibold text-brand-black">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {hint && (
          <span className="text-[11px] font-medium text-brand-muted">{hint}</span>
        )}
      </span>
      <span className="relative mt-2 block">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          className="h-11 w-full rounded-xl border border-brand-border bg-white px-4 pr-12 outline-none transition hover:border-neutral-300 focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted transition hover:bg-brand-background hover:text-brand-black disabled:opacity-40"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          title={visible ? "Hide password" : "Show password"}
        >
          <EyeIcon hidden={visible} />
        </button>
      </span>
    </label>
  );
}
